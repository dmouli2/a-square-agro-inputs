import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseProductRepository } from "./productRepository";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/client")>();
  return { ...actual, getSupabaseClient: vi.fn() };
});

type QueryResult = { data: unknown; error: { message: string; code?: string } | null };

function fakeQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const productRow = {
  id: "p1",
  slug: "taqat",
  name: "Taqat",
  brand: "Tata Rallis",
  category_id: "c1",
  description: "d",
  images: [],
  status: "active",
  is_bestseller: false,
  product_variants: [
    { id: "v1", product_id: "p1", sku: "SKU-1", label: "500 ml", pack_size: 500, unit: "ml", price: 820, mrp: 920, stock_qty: 18 },
  ],
};

describe("createSupabaseProductRepository", () => {
  const from = vi.fn();

  beforeEach(() => {
    from.mockReset();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  it("list filters to active products by default", async () => {
    const query = fakeQuery({ data: [productRow], error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseProductRepository();
    const result = await repo.list();
    expect(query.eq).toHaveBeenCalledWith("status", "active");
    expect(result[0]).toMatchObject({ id: "p1", variants: [{ id: "v1", price: 820 }] });
  });

  it("list filters by categorySlug when the category exists", async () => {
    const categoryQuery = fakeQuery({ data: { id: "c1" }, error: null });
    const productsQuery = fakeQuery({ data: [productRow], error: null });
    from.mockImplementation((table: string) => (table === "categories" ? categoryQuery : productsQuery));
    const repo = createSupabaseProductRepository();
    const result = await repo.list({ categorySlug: "crop-protection" });
    expect(productsQuery.eq).toHaveBeenCalledWith("category_id", "c1");
    expect(result).toHaveLength(1);
  });

  it("list returns an empty array when the category slug doesn't exist", async () => {
    from.mockImplementation((table: string) =>
      table === "categories" ? fakeQuery({ data: null, error: null }) : fakeQuery({ data: [], error: null })
    );
    const repo = createSupabaseProductRepository();
    expect(await repo.list({ categorySlug: "missing" })).toEqual([]);
  });

  it("list applies a sanitized ilike filter for a plain search term", async () => {
    const query = fakeQuery({ data: [productRow], error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseProductRepository();
    await repo.list({ search: "Taqat" });
    expect(query.or).toHaveBeenCalledWith("name.ilike.%Taqat%,brand.ilike.%Taqat%");
  });

  it("strips PostgREST filter-syntax characters out of the search term before building the filter", async () => {
    const query = fakeQuery({ data: [], error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseProductRepository();
    // A comma/parens/percent in the input could otherwise inject extra
    // filter clauses into PostgREST's .or() grammar or widen the LIKE
    // pattern with attacker-controlled wildcards.
    await repo.list({ search: "a,b)(c%_d" });
    expect(query.or).toHaveBeenCalledWith("name.ilike.%abcd%,brand.ilike.%abcd%");
  });

  it("skips the .or() filter entirely when the sanitized search term is empty", async () => {
    const query = fakeQuery({ data: [], error: null });
    from.mockReturnValue(query);
    const repo = createSupabaseProductRepository();
    await repo.list({ search: ",,,%%%" });
    expect(query.or).not.toHaveBeenCalled();
  });

  it("list throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.list()).rejects.toThrow("boom");
  });

  it("listAll returns every product ordered by created_at", async () => {
    from.mockReturnValue(fakeQuery({ data: [productRow], error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.listAll()).toHaveLength(1);
  });

  it("listAll defaults to empty array and throws on error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.listAll()).toEqual([]);

    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    await expect(repo.listAll()).rejects.toThrow("boom");
  });

  it("findBySlug returns null when not found and throws on error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.findBySlug("missing")).toBeNull();

    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    await expect(repo.findBySlug("taqat")).rejects.toThrow("boom");
  });

  it("findById returns null for an invalid uuid instead of throwing", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "invalid", code: "22P02" } }));
    const repo = createSupabaseProductRepository();
    expect(await repo.findById("not-a-uuid")).toBeNull();
  });

  it("findById throws on a real db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom", code: "500" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.findById("p1")).rejects.toThrow("boom");
  });

  it("findById returns the mapped product when found", async () => {
    from.mockReturnValue(fakeQuery({ data: productRow, error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.findById("p1")).toMatchObject({ id: "p1" });
  });

  it("findByVariantId resolves through the variant's product_id", async () => {
    const variantQuery = fakeQuery({ data: { product_id: "p1" }, error: null });
    const productQuery = fakeQuery({ data: productRow, error: null });
    from.mockImplementation((table: string) => (table === "product_variants" ? variantQuery : productQuery));
    const repo = createSupabaseProductRepository();
    expect(await repo.findByVariantId("v1")).toMatchObject({ id: "p1" });
  });

  it("findByVariantId returns null when the variant doesn't exist", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.findByVariantId("missing")).toBeNull();
  });

  it("findByVariantId returns null for an invalid uuid", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "invalid", code: "22P02" } }));
    const repo = createSupabaseProductRepository();
    expect(await repo.findByVariantId("not-a-uuid")).toBeNull();
  });

  it("findByVariantId throws on a real variant lookup error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom", code: "500" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.findByVariantId("v1")).rejects.toThrow("boom");
  });

  it("findByVariantId throws when the product lookup itself errors", async () => {
    const variantQuery = fakeQuery({ data: { product_id: "p1" }, error: null });
    const productQuery = fakeQuery({ data: null, error: { message: "boom" } });
    from.mockImplementation((table: string) => (table === "product_variants" ? variantQuery : productQuery));
    const repo = createSupabaseProductRepository();
    await expect(repo.findByVariantId("v1")).rejects.toThrow("boom");
  });

  it("create inserts the product, then its variants, then reloads by slug", async () => {
    const productsQuery = fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null });
    const variantsQuery = fakeQuery({ data: null, error: null });
    let call = 0;
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return variantsQuery;
      call += 1;
      return call === 1 ? productsQuery : fakeQuery({ data: productRow, error: null });
    });
    const repo = createSupabaseProductRepository();
    const result = await repo.create(
      { slug: "taqat", name: "Taqat", brand: "Tata Rallis", categoryId: "c1", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false },
      [{ sku: "SKU-1", label: "500 ml", packSize: 500, unit: "ml", price: 820, mrp: 920, stockQty: 18 }]
    );
    expect(result).toMatchObject({ id: "p1" });
    expect(variantsQuery.insert).toHaveBeenCalled();
  });

  it("create skips the variants insert when given an empty variants array", async () => {
    let call = 0;
    from.mockImplementation((table: string) => {
      if (table === "product_variants") throw new Error("should not be called");
      call += 1;
      return call === 1 ? fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null }) : fakeQuery({ data: productRow, error: null });
    });
    const repo = createSupabaseProductRepository();
    await expect(
      repo.create({ slug: "taqat", name: "Taqat", brand: "Tata Rallis", categoryId: "c1", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false }, [])
    ).resolves.toMatchObject({ id: "p1" });
  });

  it("create throws when the product insert fails", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "insert failed" } }));
    const repo = createSupabaseProductRepository();
    await expect(
      repo.create({ slug: "taqat", name: "Taqat", brand: "Tata Rallis", categoryId: "c1", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false }, [])
    ).rejects.toThrow("insert failed");
  });

  it("create throws when the variant insert fails", async () => {
    const productsQuery = fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null });
    const variantsQuery = fakeQuery({ data: null, error: { message: "variant insert failed" } });
    from.mockImplementation((table: string) => (table === "product_variants" ? variantsQuery : productsQuery));
    const repo = createSupabaseProductRepository();
    await expect(
      repo.create({ slug: "taqat", name: "Taqat", brand: "Tata Rallis", categoryId: "c1", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false }, [
        { sku: "SKU-1", label: "500 ml", packSize: 500, unit: "ml", price: 820, mrp: 920, stockQty: 18 },
      ])
    ).rejects.toThrow("variant insert failed");
  });

  it("create throws if reloading the created product by slug comes back empty", async () => {
    let call = 0;
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return fakeQuery({ data: null, error: null });
      call += 1;
      return call === 1 ? fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null }) : fakeQuery({ data: null, error: null });
    });
    const repo = createSupabaseProductRepository();
    await expect(
      repo.create({ slug: "taqat", name: "Taqat", brand: "Tata Rallis", categoryId: "c1", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false }, [])
    ).rejects.toThrow("Failed to load product after create");
  });

  it("update applies a partial patch and reloads by slug", async () => {
    let call = 0;
    from.mockImplementation(() => {
      call += 1;
      return call === 1 ? fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null }) : fakeQuery({ data: productRow, error: null });
    });
    const repo = createSupabaseProductRepository();
    expect(await repo.update("p1", { name: "New Name" })).toMatchObject({ id: "p1" });
  });

  it("update throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "update failed" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.update("p1", { name: "New Name" })).rejects.toThrow("update failed");
  });

  it("update throws if reloading after update comes back empty", async () => {
    let call = 0;
    from.mockImplementation(() => {
      call += 1;
      return call === 1 ? fakeQuery({ data: { id: "p1", slug: "taqat" }, error: null }) : fakeQuery({ data: null, error: null });
    });
    const repo = createSupabaseProductRepository();
    await expect(repo.update("p1", { name: "New Name" })).rejects.toThrow("Failed to load product after update");
  });

  it("createVariant inserts and returns the mapped variant", async () => {
    from.mockReturnValue(fakeQuery({ data: { id: "v2", product_id: "p1", sku: "SKU-2", label: "1 L", pack_size: 1, unit: "litre", price: 100, mrp: 120, stock_qty: 5 }, error: null }));
    const repo = createSupabaseProductRepository();
    expect(await repo.createVariant("p1", { sku: "SKU-2", label: "1 L", packSize: 1, unit: "litre", price: 100, mrp: 120, stockQty: 5 })).toMatchObject({ id: "v2" });
  });

  it("createVariant throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.createVariant("p1", { sku: "SKU-2", label: "1 L", packSize: 1, unit: "litre", price: 100, mrp: 120, stockQty: 5 })).rejects.toThrow("boom");
  });

  it("updateVariant applies a partial patch", async () => {
    from.mockReturnValue(fakeQuery({ data: { id: "v1", product_id: "p1", sku: "SKU-1", label: "500 ml", pack_size: 500, unit: "ml", price: 850, mrp: 920, stock_qty: 10 }, error: null }));
    const repo = createSupabaseProductRepository();
    const result = await repo.updateVariant("v1", { price: 850, stockQty: 10 });
    expect(result.price).toBe(850);
  });

  it("updateVariant throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.updateVariant("v1", { price: 850 })).rejects.toThrow("boom");
  });

  it("deleteVariant succeeds without error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseProductRepository();
    await expect(repo.deleteVariant("v1")).resolves.toBeUndefined();
  });

  it("deleteVariant throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseProductRepository();
    await expect(repo.deleteVariant("v1")).rejects.toThrow("boom");
  });
});
