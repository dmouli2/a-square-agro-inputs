"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { getImageStorage } from "@/lib/storage";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(productId: string, formData: FormData) {
  await requireRole(["admin"]);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.includes(file.type)) return;

  const product = await getDb().products.findById(productId);
  if (!product) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${productId}/${Date.now()}-${safeName}`;

  await getImageStorage().upload(file, path);
  await getDb().products.update(productId, { images: [...product.images, path] });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function removeProductImage(productId: string, path: string) {
  await requireRole(["admin"]);

  const product = await getDb().products.findById(productId);
  if (!product) return;

  await getImageStorage().remove([path]);
  await getDb().products.update(productId, { images: product.images.filter((p) => p !== path) });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
  revalidatePath("/");
}
