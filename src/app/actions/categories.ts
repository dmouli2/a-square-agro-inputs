"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";

export interface CategoryFormState {
  error: string | null;
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
}

function readCategoryFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = sortOrderRaw === "" ? 0 : Number(sortOrderRaw);
  return {
    name,
    description: String(formData.get("description") ?? "").trim() || undefined,
    sortOrder,
  };
}

function isDuplicateSlugError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? "");
  return message.includes("duplicate key");
}

export async function createCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireRole(["admin"]);
  const fields = readCategoryFields(formData);
  if (!fields.name) {
    return { error: "Category name is required." };
  }
  if (!Number.isInteger(fields.sortOrder) || fields.sortOrder < 0) {
    return { error: "Sort order must be a non-negative whole number." };
  }

  try {
    await getDb().categories.create({ ...fields, slug: slugify(fields.name), parentId: null });
  } catch (err) {
    return {
      error: isDuplicateSlugError(err)
        ? "A category with this name already exists."
        : "Could not create the category. Please try again.",
    };
  }

  revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireRole(["admin"]);
  const fields = readCategoryFields(formData);
  if (!fields.name) {
    return { error: "Category name is required." };
  }
  if (!Number.isInteger(fields.sortOrder) || fields.sortOrder < 0) {
    return { error: "Sort order must be a non-negative whole number." };
  }

  try {
    // Slug follows the name so storefront URLs stay readable; the old slug
    // simply stops matching, which the shop treats as "no category filter".
    await getDb().categories.update(id, { ...fields, slug: slugify(fields.name) });
  } catch (err) {
    return {
      error: isDuplicateSlugError(err)
        ? "A category with this name already exists."
        : "Could not update the category. Please try again.",
    };
  }

  revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  await requireRole(["admin"]);
  const db = getDb();

  // Friendly guard before the FK constraint rejects it anyway: a category
  // that still has products (any status) cannot be removed.
  const products = await db.products.listAll();
  const inUse = products.filter((p) => p.categoryId === id).length;
  if (inUse > 0) {
    throw new Error(`This category still has ${inUse} product(s). Move them to another category first.`);
  }

  await db.categories.delete(id);
  revalidateCategoryPaths();
}
