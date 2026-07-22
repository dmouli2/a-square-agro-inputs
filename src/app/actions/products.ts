"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { ProductStatus, ProductVariant } from "@/types";

export interface ProductFormState {
  error: string | null;
}

function parseCropList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function readProductFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "draft") as ProductStatus,
    cropCompatibility: parseCropList(String(formData.get("cropCompatibility") ?? "")),
    activeIngredient: String(formData.get("activeIngredient") ?? "").trim() || undefined,
    composition: String(formData.get("composition") ?? "").trim() || undefined,
    usageInstructions: String(formData.get("usageInstructions") ?? "").trim() || undefined,
    registrationNumber: String(formData.get("registrationNumber") ?? "").trim() || undefined,
    hsnCode: String(formData.get("hsnCode") ?? "").trim() || undefined,
    isBestseller: formData.get("isBestseller") === "on",
  };
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireRole(["admin"]);
  const fields = readProductFields(formData);
  if (!fields.name || !fields.brand || !fields.categoryId) {
    return { error: "Name, brand and category are required." };
  }

  const variantLabel = String(formData.get("variantLabel") ?? "").trim();
  const sku = String(formData.get("variantSku") ?? "").trim();
  const price = Number(formData.get("variantPrice"));
  const mrp = Number(formData.get("variantMrp"));
  if (!variantLabel || !sku || !Number.isFinite(price) || !Number.isFinite(mrp)) {
    return { error: "Please fill in the pack size, SKU and pricing." };
  }

  let productId: string;
  try {
    const product = await getDb().products.create(
      { ...fields, slug: slugify(fields.name), images: [] },
      [
        {
          sku,
          label: variantLabel,
          packSize: Number(formData.get("variantPackSize")) || 1,
          unit: String(formData.get("variantUnit") ?? "piece") as ProductVariant["unit"],
          price,
          mrp,
          stockQty: Number(formData.get("variantStockQty")) || 0,
        },
      ]
    );
    productId = product.id;
  } catch {
    return { error: "Something went wrong creating the product. Check that the SKU is unique." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${productId}/edit`);
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireRole(["admin"]);
  const fields = readProductFields(formData);
  if (!fields.name || !fields.brand || !fields.categoryId) {
    return { error: "Name, brand and category are required." };
  }

  try {
    await getDb().products.update(id, fields);
  } catch {
    return { error: "Something went wrong updating the product." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/shop");
  return { error: null };
}

export async function addVariant(productId: string, formData: FormData) {
  await requireRole(["admin"]);
  const label = String(formData.get("label") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price"));
  const mrp = Number(formData.get("mrp"));
  if (!label || !sku || !Number.isFinite(price) || !Number.isFinite(mrp)) return;

  await getDb().products.createVariant(productId, {
    sku,
    label,
    packSize: Number(formData.get("packSize")) || 1,
    unit: String(formData.get("unit") ?? "piece") as ProductVariant["unit"],
    price,
    mrp,
    stockQty: Number(formData.get("stockQty")) || 0,
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
}

export async function editVariant(variantId: string, productId: string, formData: FormData) {
  await requireRole(["admin"]);
  const price = Number(formData.get("price"));
  const mrp = Number(formData.get("mrp"));
  const stockQty = Number(formData.get("stockQty"));
  if (!Number.isFinite(price) || !Number.isFinite(mrp) || !Number.isFinite(stockQty)) return;

  await getDb().products.updateVariant(variantId, { price, mrp, stockQty });
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
}

export async function removeVariant(variantId: string, productId: string) {
  await requireRole(["admin"]);
  await getDb().products.deleteVariant(variantId);
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
}
