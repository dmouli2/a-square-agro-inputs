"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/net";
import { logError } from "@/lib/errorLog";
import { CART_COOKIE, getCartMap } from "@/lib/cart";
import { PHONE_COOKIE, PHONE_COOKIE_MAX_AGE, isValidPhone } from "@/lib/orderLookup";

export interface CheckoutState {
  error: string | null;
  /** Per-field messages so the form can highlight exactly what needs fixing. */
  fieldErrors?: Record<string, string>;
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

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Enter your full name.";
  if (!phone) fieldErrors.phone = "Enter your phone number.";
  else if (!isValidPhone(phone)) fieldErrors.phone = "Enter a valid 10-digit phone number.";
  if (!line1) fieldErrors.line1 = "Enter your house / street address.";
  if (!district) fieldErrors.district = "Enter your district.";
  if (!state) fieldErrors.state = "Enter your state.";
  if (!pincode) fieldErrors.pincode = "Enter your pincode.";
  else if (!/^\d{6}$/.test(pincode)) fieldErrors.pincode = "Enter a valid 6-digit pincode.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields below.", fieldErrors };
  }
  // Every field above is confirmed non-null by the fieldErrors check just above.
  const validFullName = fullName as string;
  const validPhone = phone as string;
  const validLine1 = line1 as string;
  const validDistrict = district as string;
  const validState = state as string;
  const validPincode = pincode as string;

  const ip = await getClientIp();
  const rateLimit = await getDb().rateLimiter.checkAndRecord({ ip, phone: validPhone });
  if (!rateLimit.allowed) {
    return { error: "Too many order attempts from this number/network. Please wait a few minutes and try again." };
  }

  const email = requiredField(formData, "email") ?? undefined;
  const line2 = requiredField(formData, "line2") ?? undefined;
  const village = requiredField(formData, "village") ?? undefined;

  let orderId: string;
  try {
    const order = await getDb().orders.create({
      customer: { fullName: validFullName, phone: validPhone, email },
      address: {
        fullName: validFullName,
        phone: validPhone,
        line1: validLine1,
        line2,
        village,
        district: validDistrict,
        state: validState,
        pincode: validPincode,
      },
      items,
    });
    orderId = order.id;
  } catch (err) {
    // The repository throws a specific, customer-actionable message for
    // stale/out-of-stock cart items (see orderRepository.create) — surface
    // that instead of a generic failure so the shopper knows to adjust
    // quantities rather than just retrying the same order.
    const isKnownMessage =
      err instanceof Error && (err.message.includes("no longer available") || err.message.includes("exceed available stock"));
    if (!isKnownMessage) {
      await logError(err, "/cart", { stage: "placeOrder" });
    }
    const message = isKnownMessage
      ? (err as Error).message
      : "Something went wrong placing your order. Please try again.";
    return { error: message };
  }

  const store = await cookies();
  store.delete(CART_COOKIE);
  // Remember the phone so /orders can show this customer's history without
  // asking again. httpOnly: only server pages need it, no client JS does.
  store.set(PHONE_COOKIE, validPhone, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PHONE_COOKIE_MAX_AGE,
  });
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}
