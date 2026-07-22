import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseErrorLogRepository } from "./errorLogRepository";

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient: vi.fn() }));

type QueryResult = { data: unknown; error: { message: string } | null };

function fakeSelectQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe("createSupabaseErrorLogRepository", () => {
  const from = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    from.mockReset();
    consoleErrorSpy.mockClear();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  describe("create", () => {
    it("inserts the entry", async () => {
      const insert = vi.fn(() => Promise.resolve({ error: null }));
      from.mockReturnValue({ insert });

      const repo = createSupabaseErrorLogRepository();
      await repo.create({ message: "boom", stack: "at x", context: { path: "/cart" }, path: "/cart" });

      expect(insert).toHaveBeenCalledWith({ message: "boom", stack: "at x", context: { path: "/cart" }, path: "/cart" });
    });

    it("swallows and logs an insert error instead of throwing", async () => {
      const insert = vi.fn(() => Promise.resolve({ error: { message: "db down" } }));
      from.mockReturnValue({ insert });

      const repo = createSupabaseErrorLogRepository();
      await expect(repo.create({ message: "boom" })).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("swallows a thrown exception from the client itself", async () => {
      from.mockImplementation(() => {
        throw new Error("client unavailable");
      });

      const repo = createSupabaseErrorLogRepository();
      await expect(repo.create({ message: "boom" })).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("maps rows to ErrorLogEntry, defaulting the limit to 100", async () => {
      const query = fakeSelectQuery({
        data: [
          {
            id: "err-1",
            message: "boom",
            stack: "at x",
            context: { path: "/cart" },
            path: "/cart",
            created_at: "2026-07-22T00:00:00.000Z",
          },
        ],
        error: null,
      });
      from.mockReturnValue(query);

      const repo = createSupabaseErrorLogRepository();
      const result = await repo.list();

      expect(query.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual([
        {
          id: "err-1",
          message: "boom",
          stack: "at x",
          context: { path: "/cart" },
          path: "/cart",
          createdAt: "2026-07-22T00:00:00.000Z",
        },
      ]);
    });

    it("respects a custom limit", async () => {
      const query = fakeSelectQuery({ data: [], error: null });
      from.mockReturnValue(query);

      const repo = createSupabaseErrorLogRepository();
      await repo.list(10);

      expect(query.limit).toHaveBeenCalledWith(10);
    });

    it("defaults missing optional fields to undefined", async () => {
      const query = fakeSelectQuery({
        data: [{ id: "err-2", message: "boom", stack: null, context: null, path: null, created_at: "2026-07-22T00:00:00.000Z" }],
        error: null,
      });
      from.mockReturnValue(query);

      const repo = createSupabaseErrorLogRepository();
      const [entry] = await repo.list();

      expect(entry.stack).toBeUndefined();
      expect(entry.context).toBeUndefined();
      expect(entry.path).toBeUndefined();
    });

    it("defaults to an empty array when data is null", async () => {
      from.mockReturnValue(fakeSelectQuery({ data: null, error: null }));
      const repo = createSupabaseErrorLogRepository();
      expect(await repo.list()).toEqual([]);
    });

    it("throws on a db error", async () => {
      from.mockReturnValue(fakeSelectQuery({ data: null, error: { message: "boom" } }));
      const repo = createSupabaseErrorLogRepository();
      await expect(repo.list()).rejects.toThrow("boom");
    });
  });
});
