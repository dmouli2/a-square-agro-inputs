"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CART_COOKIE, getCartMap, isValidQuantity, MAX_ITEM_QUANTITY, type CartMap } from "@/lib/cart";

async function saveCart(cart: CartMap) {
  const store = await cookies();
  const nonZero = Object.fromEntries(Object.entries(cart).filter(([, qty]) => qty > 0));
  if (Object.keys(nonZero).length === 0) {
    store.delete(CART_COOKIE);
  } else {
    store.set(CART_COOKIE, JSON.stringify(nonZero), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  revalidatePath("/", "layout");
}

export async function addToCart(variantId: string, quantity: number) {
  if (typeof variantId !== "string" || !variantId || !isValidQuantity(quantity)) return;
  const cart = await getCartMap();
  cart[variantId] = Math.min((cart[variantId] ?? 0) + quantity, MAX_ITEM_QUANTITY);
  await saveCart(cart);
}

export async function updateCartQuantity(variantId: string, quantity: number) {
  if (typeof variantId !== "string" || !variantId) return;
  const cart = await getCartMap();
  if (quantity <= 0) {
    delete cart[variantId];
  } else if (isValidQuantity(quantity)) {
    cart[variantId] = quantity;
  } else {
    return;
  }
  await saveCart(cart);
}

export async function removeFromCart(variantId: string) {
  if (typeof variantId !== "string" || !variantId) return;
  const cart = await getCartMap();
  delete cart[variantId];
  await saveCart(cart);
}

export async function removeManyFromCart(variantIds: string[]) {
  if (!Array.isArray(variantIds)) return;
  const cart = await getCartMap();
  for (const variantId of variantIds) {
    if (typeof variantId === "string") delete cart[variantId];
  }
  await saveCart(cart);
}

export async function clearCart() {
  await saveCart({});
}
