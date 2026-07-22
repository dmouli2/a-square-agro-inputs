"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { CART_COOKIE, getCartMap } from "@/lib/cart";
import { PHONE_COOKIE, PHONE_COOKIE_MAX_AGE, isValidPhone } from "@/lib/orderLookup";

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
  if (!isValidPhone(phone)) {
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
  } catch (err) {
    // The repository throws a specific, customer-actionable message for
    // stale/out-of-stock cart items (see orderRepository.create) — surface
    // that instead of a generic failure so the shopper knows to adjust
    // quantities rather than just retrying the same order.
    const message =
      err instanceof Error && (err.message.includes("no longer available") || err.message.includes("exceed available stock"))
        ? err.message
        : "Something went wrong placing your order. Please try again.";
    return { error: message };
  }

  const store = await cookies();
  store.delete(CART_COOKIE);
  // Remember the phone so /orders can show this customer's history without
  // asking again. httpOnly: only server pages need it, no client JS does.
  store.set(PHONE_COOKIE, phone, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PHONE_COOKIE_MAX_AGE,
  });
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}
