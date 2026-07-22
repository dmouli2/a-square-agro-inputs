"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CART_COOKIE, getCartMap, type CartMap } from "@/lib/cart";

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
  const cart = await getCartMap();
  cart[variantId] = (cart[variantId] ?? 0) + quantity;
  await saveCart(cart);
}

export async function updateCartQuantity(variantId: string, quantity: number) {
  const cart = await getCartMap();
  if (quantity <= 0) {
    delete cart[variantId];
  } else {
    cart[variantId] = quantity;
  }
  await saveCart(cart);
}

export async function removeFromCart(variantId: string) {
  const cart = await getCartMap();
  delete cart[variantId];
  await saveCart(cart);
}

export async function clearCart() {
  await saveCart({});
}
