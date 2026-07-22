"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { CART_COOKIE, getCartMap } from "@/lib/cart";

export interface CheckoutState {
  error: string | null;
}

function requiredField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

export async function placeOrder(_prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const cart = await getCartMap();
  const items = Object.entries(cart).map(([variantId, quantity]) => ({ variantId, quantity }));
  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const fullName = requiredField(formData, "fullName");
  const phone = requiredField(formData, "phone");
  const line1 = requiredField(formData, "line1");
  const district = requiredField(formData, "district");
  const state = requiredField(formData, "state");
  const pincode = requiredField(formData, "pincode");

  if (!fullName || !phone || !line1 || !district || !state || !pincode) {
    return { error: "Please fill in your name, phone, address, district, state and pincode." };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { error: "Please enter a valid 10-digit phone number." };
  }
  if (!/^\d{6}$/.test(pincode)) {
    return { error: "Please enter a valid 6-digit pincode." };
  }

  const email = requiredField(formData, "email") ?? undefined;
  const line2 = requiredField(formData, "line2") ?? undefined;
  const village = requiredField(formData, "village") ?? undefined;

  let orderId: string;
  try {
    const order = await getDb().orders.create({
      customer: { fullName, phone, email },
      address: { fullName, phone, line1, line2, village, district, state, pincode },
      items,
    });
    orderId = order.id;
  } catch {
    return { error: "Something went wrong placing your order. Please try again." };
  }

  const store = await cookies();
  store.delete(CART_COOKIE);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}
