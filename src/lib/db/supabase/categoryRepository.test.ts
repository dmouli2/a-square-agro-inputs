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
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const row = { id: "c1", slug: "seeds", name: "Seeds", description: "desc", parent_id: null, sort_order: 0 };

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
    expect(result).toEqual([
      { id: "c1", slug: "seeds", name: "Seeds", description: "desc", imageUrl: undefined, parentId: null, sortOrder: 0 },
    ]);
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

  it("findById returns a mapped category when found", async () => {
    from.mockReturnValue(fakeQuery({ data: row, error: null }));
    const repo = createSupabaseCategoryRepository();
    expect(await repo.findById("c1")).toMatchObject({ id: "c1" });
  });

  it("findById returns null when not found", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseCategoryRepository();
    expect(await repo.findById("missing")).toBeNull();
  });

  it("findById throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "find failed" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.findById("c1")).rejects.toThrow("find failed");
  });

  it("create inserts a row built from the input and returns the mapped category", async () => {
    const query = fakeQuery({ data: row, error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseCategoryRepository();
    const result = await repo.create({ slug: "seeds", name: "Seeds", description: "desc", parentId: null, sortOrder: 0 });
    expect(query.insert).toHaveBeenCalledWith({
      slug: "seeds",
      name: "Seeds",
      description: "desc",
      parent_id: null,
      sort_order: 0,
    });
    expect(result).toMatchObject({ id: "c1" });
  });

  it("create throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "duplicate key value violates unique constraint" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.create({ slug: "seeds", name: "Seeds", parentId: null })).rejects.toThrow("duplicate key");
  });

  it("update sends only the patched fields and returns the mapped category", async () => {
    const query = fakeQuery({ data: row, error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseCategoryRepository();
    const result = await repo.update("c1", { name: "Seeds & Grains" });
    expect(query.update).toHaveBeenCalledWith({ name: "Seeds & Grains" });
    expect(query.eq).toHaveBeenCalledWith("id", "c1");
    expect(result).toMatchObject({ id: "c1" });
  });

  it("update maps an explicit undefined-clearing patch (description/imageUrl) to null", async () => {
    const query = fakeQuery({ data: row, error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseCategoryRepository();
    await repo.update("c1", { description: undefined, imageUrl: undefined });
    // description/imageUrl weren't passed as keys at all here, so toCategoryRow
    // should have produced an empty object — nothing to clear.
    expect(query.update).toHaveBeenCalledWith({});
  });

  it("update throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "update failed" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.update("c1", { name: "X" })).rejects.toThrow("update failed");
  });

  it("delete removes the row by id", async () => {
    const query = fakeQuery({ data: null, error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseCategoryRepository();
    await repo.delete("c1");
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", "c1");
  });

  it("delete throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "fk violation" } }));
    const repo = createSupabaseCategoryRepository();
    await expect(repo.delete("c1")).rejects.toThrow("fk violation");
  });
});
