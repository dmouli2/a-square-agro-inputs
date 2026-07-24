import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseLoginRateLimiterRepository } from "./loginRateLimitRepository";
import { LOGIN_RATE_LIMIT_MAX_PER_EMAIL, LOGIN_RATE_LIMIT_MAX_PER_IP, LOGIN_RATE_LIMIT_WINDOW_SECONDS } from "@/lib/db/rateLimitConfig";

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient: vi.fn() }));

type CountResult = { count: number | null; error: { message: string } | null };

function fakeCountQuery(result: CountResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    then: (resolve: (r: CountResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

function fakeInsert(error: { message: string } | null) {
  return { insert: vi.fn(() => Promise.resolve({ error })) };
}

describe("createSupabaseLoginRateLimiterRepository", () => {
  const from = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    from.mockReset();
    consoleErrorSpy.mockClear();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  it("allows the request and records it when both counts are under the limit", async () => {
    from
      .mockReturnValueOnce(fakeCountQuery({ count: 1, error: null }))
      .mockReturnValueOnce(fakeCountQuery({ count: 1, error: null }))
      .mockReturnValueOnce(fakeInsert(null));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: true });
  });

  it("blocks once the per-email count reaches the limit, without inserting a fresh attempt", async () => {
    from
      .mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }))
      .mockReturnValueOnce(fakeCountQuery({ count: LOGIN_RATE_LIMIT_MAX_PER_EMAIL, error: null }))
      .mockReturnValueOnce(fakeInsert(null));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS });
  });

  it("blocks once the per-ip count reaches the limit", async () => {
    from
      .mockReturnValueOnce(fakeCountQuery({ count: LOGIN_RATE_LIMIT_MAX_PER_IP, error: null }))
      .mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }))
      .mockReturnValueOnce(fakeInsert(null));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS });
  });

  it("treats a null count as zero", async () => {
    from
      .mockReturnValueOnce(fakeCountQuery({ count: null, error: null }))
      .mockReturnValueOnce(fakeCountQuery({ count: null, error: null }))
      .mockReturnValueOnce(fakeInsert(null));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: true });
  });

  it("fails open and logs when the ip count query errors", async () => {
    from.mockReturnValueOnce(fakeCountQuery({ count: null, error: { message: "boom" } }));
    from.mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: true });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("fails open and logs when the email count query errors", async () => {
    from.mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }));
    from.mockReturnValueOnce(fakeCountQuery({ count: null, error: { message: "boom" } }));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: true });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("fails open and logs when recording the attempt fails to insert", async () => {
    from
      .mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }))
      .mockReturnValueOnce(fakeCountQuery({ count: 0, error: null }))
      .mockReturnValueOnce(fakeInsert({ message: "insert failed" }));

    const repo = createSupabaseLoginRateLimiterRepository();
    const result = await repo.checkAndRecord({ ip: "1.2.3.4", email: "admin@example.com" });

    expect(result).toEqual({ allowed: true });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
