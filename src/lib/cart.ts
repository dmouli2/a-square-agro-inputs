import { cookies } from "next/headers";

export const CART_COOKIE = "a2_cart";

export type CartMap = Record<string, number>;

export async function getCartMap(): Promise<CartMap> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as CartMap;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function getCartCount(): Promise<number> {
  const cart = await getCartMap();
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}
