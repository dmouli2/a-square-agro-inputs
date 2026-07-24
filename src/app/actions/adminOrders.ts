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

export interface UpdateOrderStatusState {
  error: string | null;
  status: OrderStatus;
}

// Takes the current status as state so a failed/rejected update can report
// an error while leaving the UI showing the last known-good status, and a
// successful one hands back the confirmed value for the (client, controlled)
// <select> to sync to — a plain server-only <form> here previously left the
// dropdown showing whatever was selected pre-submit even after the database
// write succeeded, because an uncontrolled select's defaultValue only applies
// on mount and doesn't re-sync on Next's post-action re-render.
export async function updateOrderStatus(
  orderId: string,
  prevState: UpdateOrderStatusState,
  formData: FormData
): Promise<UpdateOrderStatusState> {
  await requireRole(["admin"]);
  const status = String(formData.get("status"));
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { error: "Invalid status.", status: prevState.status };
  }

  await getDb().orders.updateStatus(orderId, status as OrderStatus);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { error: null, status: status as OrderStatus };
}
