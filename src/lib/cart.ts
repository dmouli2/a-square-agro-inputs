import { cookies } from "next/headers";

export const CART_COOKIE = "a2_cart";

export type CartMap = Record<string, number>;

// The cart cookie is not httpOnly (client JS reads it for the cart-count
// badge) and its value round-trips through Server Actions whose arguments a
// client can call directly with arbitrary values, bypassing any UI-level
// input constraints. isValidQuantity()/getCartMap() are the single choke
// point every cart mutation and checkout goes through, so a forged cookie or
// a direct action call can never smuggle a negative, fractional, zero, or
// unreasonably large quantity into an order.
export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 999;

export function isValidQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_ITEM_QUANTITY &&
    value <= MAX_ITEM_QUANTITY
  );
}

export async function getCartMap(): Promise<CartMap> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as CartMap;
    if (typeof parsed !== "object" || parsed === null) return {};
    const sanitized: CartMap = {};
    for (const [variantId, quantity] of Object.entries(parsed)) {
      if (variantId && isValidQuantity(quantity)) {
        sanitized[variantId] = quantity;
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

export async function getCartCount(): Promise<number> {
  const cart = await getCartMap();
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}
