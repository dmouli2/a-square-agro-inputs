"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import type { OrderStatus } from "@/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireRole(["admin"]);
  const status = String(formData.get("status"));
  if (!VALID_STATUSES.includes(status as OrderStatus)) return;

  await getDb().orders.updateStatus(orderId, status as OrderStatus);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
