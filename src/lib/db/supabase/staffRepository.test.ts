import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseStaffRepository } from "./staffRepository";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

function fakeQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const row = { id: "s1", name: "Admin", email: "admin@example.com", password_hash: "hash", role: "admin" as const, active: true };

describe("createSupabaseStaffRepository", () => {
  const from = vi.fn();

  beforeEach(() => {
    from.mockReset();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  it("findByEmail returns a mapped staff record when found", async () => {
    from.mockReturnValue(fakeQuery({ data: row, error: null }));
    const repo = createSupabaseStaffRepository();
    expect(await repo.findByEmail("admin@example.com")).toEqual({
      id: "s1",
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "hash",
      role: "admin",
      active: true,
    });
  });

  it("findByEmail returns null when not found", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseStaffRepository();
    expect(await repo.findByEmail("nobody@example.com")).toBeNull();
  });

  it("findByEmail throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseStaffRepository();
    await expect(repo.findByEmail("admin@example.com")).rejects.toThrow("boom");
  });

  it("findById returns a mapped staff record when found", async () => {
    from.mockReturnValue(fakeQuery({ data: row, error: null }));
    const repo = createSupabaseStaffRepository();
    expect(await repo.findById("s1")).toMatchObject({ id: "s1" });
  });

  it("findById returns null when not found", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseStaffRepository();
    expect(await repo.findById("missing")).toBeNull();
  });

  it("findById throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "find failed" } }));
    const repo = createSupabaseStaffRepository();
    await expect(repo.findById("s1")).rejects.toThrow("find failed");
  });
});
