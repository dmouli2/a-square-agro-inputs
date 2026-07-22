import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseCategoryRepository } from "./categoryRepository";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

function fakeQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const row = { id: "c1", slug: "seeds", name: "Seeds", description: "desc", parent_id: null };

describe("createSupabaseCategoryRepository", () => {
  const from = vi.fn();

  beforeEach(() => {
    from.mockReset();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  it("list returns mapped categories sorted by sort_order", async () => {
    const query = fakeQuery({ data: [row], error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseCategoryRepository();
    const result = await repo.list();
    expect(result).toEqual([{ id: "c1", slug: "seeds", name: "Seeds", description: "desc", imageUrl: undefined, parentId: null }]);
    expect(query.order).toHaveBeenCalledWith("sort_order", { ascending: true });
  });

  it("list defaults to an empty array when data is null", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseCategoryRepository();
    expect(await repo.list()).toEqual([]);
  });

  it("list throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.list()).rejects.toThrow("boom");
  });

  it("findBySlug returns a mapped category when found", async () => {
    from.mockReturnValue(fakeQuery({ data: row, error: null }));
    const repo = createSupabaseCategoryRepository();
    expect(await repo.findBySlug("seeds")).toMatchObject({ id: "c1", slug: "seeds" });
  });

  it("findBySlug returns null when not found", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseCategoryRepository();
    expect(await repo.findBySlug("missing")).toBeNull();
  });

  it("findBySlug throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "find failed" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.findBySlug("seeds")).rejects.toThrow("find failed");
  });
});
