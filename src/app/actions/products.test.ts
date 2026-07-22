import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRevalidatePath } from "../../../vitest.setup";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { createProduct, updateProduct, addVariant, editVariant, removeVariant } from "./products";
import type { Staff } from "@/types";

vi.mock("@/lib/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const admin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const validProductFields = {
  name: "Taqat Insecticide",
  brand: "Tata Rallis",
  categoryId: "cat-crop-protection",
  variantLabel: "500 ml",
  variantSku: "TAQAT-500ML",
  variantPrice: "820",
  variantMrp: "920",
};

describe("createProduct", () => {
  const create = vi.fn();

  beforeEach(() => {
    create.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { create } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role before doing anything else", async () => {
    await createProduct({ error: null }, formData(validProductFields)).catch(() => {});
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("rejects when name/brand/category are missing", async () => {
    const result = await createProduct({ error: null }, formData({ name: "", brand: "", categoryId: "" }));
    expect(result.error).toMatch(/required/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects when the pack size, SKU, or pricing is missing/invalid", async () => {
    const result = await createProduct(
      { error: null },
      formData({ name: "X", brand: "Y", categoryId: "c1", variantLabel: "", variantSku: "", variantPrice: "abc", variantMrp: "abc" })
    );
    expect(result.error).toMatch(/pack size, SKU and pricing/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the product with a slugified name and redirects to the edit page", async () => {
    create.mockResolvedValue({ id: "prod-1" });
    await expect(createProduct({ error: null }, formData(validProductFields))).rejects.toThrow("NEXT_REDIRECT:/admin/products/prod-1/edit");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "taqat-insecticide", name: "Taqat Insecticide" }),
      [expect.objectContaining({ sku: "TAQAT-500ML", price: 820, mrp: 920, packSize: 1, stockQty: 0 })]
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
  });

  it("parses the comma-separated crop compatibility list, trimming blanks", async () => {
    create.mockResolvedValue({ id: "prod-1" });
    await createProduct({ error: null }, formData({ ...validProductFields, cropCompatibility: "Cotton, Chilli ,, Vegetables" })).catch(() => {});
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ cropCompatibility: ["Cotton", "Chilli", "Vegetables"] }), expect.anything());
  });

  it("returns a friendly error when the repository throws (e.g. duplicate SKU)", async () => {
    create.mockRejectedValue(new Error("duplicate key"));
    const result = await createProduct({ error: null }, formData(validProductFields));
    expect(result.error).toMatch(/SKU is unique/i);
  });
});

describe("updateProduct", () => {
  const update = vi.fn();

  beforeEach(() => {
    update.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { update } } as never);
    mockRevalidatePath.mockClear();
  });

  it("rejects when name/brand/category are missing", async () => {
    const result = await updateProduct("prod-1", { error: null }, formData({ name: "", brand: "", categoryId: "" }));
    expect(result.error).toMatch(/required/i);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the product and revalidates every affected route", async () => {
    update.mockResolvedValue({ id: "prod-1" });
    const result = await updateProduct("prod-1", { error: null }, formData(validProductFields));
    expect(result.error).toBeNull();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
  });

  it("returns a friendly error when the repository throws", async () => {
    update.mockRejectedValue(new Error("boom"));
    const result = await updateProduct("prod-1", { error: null }, formData(validProductFields));
    expect(result.error).toMatch(/went wrong updating/i);
  });
});

describe("addVariant", () => {
  const createVariant = vi.fn();

  beforeEach(() => {
    createVariant.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { createVariant } } as never);
    mockRevalidatePath.mockClear();
  });

  it("silently returns without calling the repository when required fields are missing/invalid", async () => {
    await addVariant("prod-1", formData({ label: "", sku: "", price: "x", mrp: "x" }));
    expect(createVariant).not.toHaveBeenCalled();
  });

  it("creates the variant and revalidates the edit page and shop", async () => {
    await addVariant("prod-1", formData({ label: "1 L", sku: "SKU-2", price: "100", mrp: "120" }));
    expect(createVariant).toHaveBeenCalledWith("prod-1", expect.objectContaining({ sku: "SKU-2", price: 100, mrp: 120, packSize: 1, stockQty: 0 }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
  });
});

describe("editVariant", () => {
  const updateVariant = vi.fn();

  beforeEach(() => {
    updateVariant.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { updateVariant } } as never);
    mockRevalidatePath.mockClear();
  });

  it("silently returns when price/mrp/stockQty aren't valid numbers", async () => {
    await editVariant("v1", "prod-1", formData({ price: "x", mrp: "100", stockQty: "5" }));
    expect(updateVariant).not.toHaveBeenCalled();
  });

  it("updates the variant with the parsed numeric fields", async () => {
    await editVariant("v1", "prod-1", formData({ price: "850", mrp: "920", stockQty: "10" }));
    expect(updateVariant).toHaveBeenCalledWith("v1", { price: 850, mrp: 920, stockQty: 10 });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
  });
});

describe("removeVariant", () => {
  const deleteVariant = vi.fn();

  beforeEach(() => {
    deleteVariant.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { deleteVariant } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role, deletes the variant, and revalidates", async () => {
    await removeVariant("v1", "prod-1");
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
    expect(deleteVariant).toHaveBeenCalledWith("v1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
  });
});
