import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRevalidatePath } from "../../../vitest.setup";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { createCategory, updateCategory, deleteCategory } from "./categories";
import type { Staff } from "@/types";

vi.mock("@/lib/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const admin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("createCategory", () => {
  const create = vi.fn();
  const listAll = vi.fn();

  beforeEach(() => {
    create.mockReset();
    listAll.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ categories: { create }, products: { listAll } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role before doing anything else", async () => {
    await createCategory({ error: null }, formData({ name: "Seeds" })).catch(() => {});
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("rejects an empty name", async () => {
    const result = await createCategory({ error: null }, formData({ name: "" }));
    expect(result.error).toMatch(/name is required/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a negative or fractional sort order", async () => {
    expect((await createCategory({ error: null }, formData({ name: "Seeds", sortOrder: "-1" }))).error).toMatch(
      /non-negative whole number/i
    );
    expect((await createCategory({ error: null }, formData({ name: "Seeds", sortOrder: "1.5" }))).error).toMatch(
      /non-negative whole number/i
    );
  });

  it("slugifies the name and creates the category, then redirects", async () => {
    create.mockResolvedValue({ id: "CAT-1" });
    await expect(
      createCategory({ error: null }, formData({ name: "Crop Protection", description: "Sprays", sortOrder: "2" }))
    ).rejects.toThrow("NEXT_REDIRECT:/admin/categories");
    expect(create).toHaveBeenCalledWith({
      name: "Crop Protection",
      description: "Sprays",
      sortOrder: 2,
      slug: "crop-protection",
      parentId: null,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/categories");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
  });

  it("defaults sort order to 0 when left blank", async () => {
    create.mockResolvedValue({ id: "CAT-1" });
    await createCategory({ error: null }, formData({ name: "Seeds" })).catch(() => {});
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 0 }));
  });

  it("surfaces a friendly error for a duplicate slug", async () => {
    create.mockRejectedValue(new Error('duplicate key value violates unique constraint "categories_slug_key"'));
    const result = await createCategory({ error: null }, formData({ name: "Seeds" }));
    expect(result.error).toMatch(/already exists/i);
  });

  it("falls back to a generic error for an unexpected failure", async () => {
    create.mockRejectedValue(new Error("connection refused"));
    const result = await createCategory({ error: null }, formData({ name: "Seeds" }));
    expect(result.error).toBe("Could not create the category. Please try again.");
  });

  it("falls back to a generic error for a non-Error rejection", async () => {
    create.mockRejectedValue("boom");
    const result = await createCategory({ error: null }, formData({ name: "Seeds" }));
    expect(result.error).toBe("Could not create the category. Please try again.");
  });

  it("rejects an entirely absent name field, not just a blank one", async () => {
    const result = await createCategory({ error: null }, new FormData());
    expect(result.error).toMatch(/name is required/i);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("updateCategory", () => {
  const update = vi.fn();

  beforeEach(() => {
    update.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ categories: { update } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role", async () => {
    await updateCategory("CAT-1", { error: null }, formData({ name: "Seeds" })).catch(() => {});
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("rejects an empty name", async () => {
    const result = await updateCategory("CAT-1", { error: null }, formData({ name: "" }));
    expect(result.error).toMatch(/name is required/i);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an invalid sort order", async () => {
    const result = await updateCategory("CAT-1", { error: null }, formData({ name: "Seeds", sortOrder: "-2" }));
    expect(result.error).toMatch(/non-negative whole number/i);
  });

  it("re-slugifies from the new name and updates, then redirects", async () => {
    update.mockResolvedValue({ id: "CAT-1" });
    await expect(
      updateCategory("CAT-1", { error: null }, formData({ name: "Organic Seeds", sortOrder: "1" }))
    ).rejects.toThrow("NEXT_REDIRECT:/admin/categories");
    expect(update).toHaveBeenCalledWith("CAT-1", {
      name: "Organic Seeds",
      description: undefined,
      sortOrder: 1,
      slug: "organic-seeds",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("surfaces a friendly error for a duplicate slug", async () => {
    update.mockRejectedValue(new Error("duplicate key value violates unique constraint"));
    const result = await updateCategory("CAT-1", { error: null }, formData({ name: "Seeds" }));
    expect(result.error).toMatch(/already exists/i);
  });

  it("falls back to a generic error for an unexpected failure", async () => {
    update.mockRejectedValue(new Error("connection refused"));
    const result = await updateCategory("CAT-1", { error: null }, formData({ name: "Seeds" }));
    expect(result.error).toBe("Could not update the category. Please try again.");
  });
});

describe("deleteCategory", () => {
  const del = vi.fn();
  const listAll = vi.fn();

  beforeEach(() => {
    del.mockReset();
    listAll.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ categories: { delete: del }, products: { listAll } } as never);
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role", async () => {
    listAll.mockResolvedValue([]);
    await deleteCategory("CAT-1");
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("deletes and revalidates when the category has no products", async () => {
    listAll.mockResolvedValue([]);
    await deleteCategory("CAT-1");
    expect(del).toHaveBeenCalledWith("CAT-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("throws a friendly error and does not delete when products still reference the category", async () => {
    listAll.mockResolvedValue([
      { id: "p1", categoryId: "CAT-1" },
      { id: "p2", categoryId: "CAT-1" },
      { id: "p3", categoryId: "CAT-2" },
    ]);
    await expect(deleteCategory("CAT-1")).rejects.toThrow("This category still has 2 product(s)");
    expect(del).not.toHaveBeenCalled();
  });
});
