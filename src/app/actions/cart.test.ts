import { describe, it, expect, beforeEach } from "vitest";
import { mockCookieStore, mockRevalidatePath } from "../../../vitest.setup";
import { CART_COOKIE, MAX_ITEM_QUANTITY } from "@/lib/cart";
import { addToCart, updateCartQuantity, removeFromCart, removeManyFromCart, clearCart } from "./cart";

function cartCookieValue(): Record<string, number> {
  // Read the store's actual current value (not just the last .set() call)
  // so this helper stays correct even when saveCart() takes the delete
  // branch (empty cart) rather than the set branch.
  const entry = mockCookieStore.get(CART_COOKIE);
  return entry ? JSON.parse(entry.value) : {};
}

describe("addToCart", () => {
  beforeEach(() => {
    mockCookieStore.set.mockClear();
  });

  it("adds a new line to an empty cart", async () => {
    await addToCart("v1", 2);
    expect(cartCookieValue()).toEqual({ v1: 2 });
  });

  it("accumulates quantity for a variant already in the cart", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    await addToCart("v1", 3);
    expect(cartCookieValue()).toEqual({ v1: 5 });
  });

  it("caps accumulated quantity at MAX_ITEM_QUANTITY instead of overflowing", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: MAX_ITEM_QUANTITY - 1 }));
    await addToCart("v1", 50);
    expect(cartCookieValue()).toEqual({ v1: MAX_ITEM_QUANTITY });
  });

  it("silently rejects a non-positive, fractional, or over-cap quantity (no cookie write)", async () => {
    await addToCart("v1", 0);
    await addToCart("v1", -3);
    await addToCart("v1", 1.5);
    await addToCart("v1", MAX_ITEM_QUANTITY + 1);
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("silently rejects an empty/non-string variantId", async () => {
    await addToCart("", 1);
    // @ts-expect-error -- exercising a raw Server Action call with a bad type
    await addToCart(42, 1);
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

describe("updateCartQuantity", () => {
  beforeEach(() => {
    mockCookieStore.set.mockClear();
    mockCookieStore.delete.mockClear();
  });

  it("sets a new quantity for a valid value", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    mockCookieStore.set.mockClear();
    await updateCartQuantity("v1", 7);
    expect(cartCookieValue()).toEqual({ v1: 7 });
  });

  it("removes the line when the quantity is zero or negative (intentional stepper-to-zero UX)", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    await updateCartQuantity("v1", 0);
    expect(cartCookieValue()).toEqual({});
  });

  it("rejects a fractional or over-cap quantity, leaving the cart untouched", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    mockCookieStore.set.mockClear();
    await updateCartQuantity("v1", 1.5);
    expect(mockCookieStore.set).not.toHaveBeenCalled();

    await updateCartQuantity("v1", MAX_ITEM_QUANTITY + 1);
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("silently rejects an empty/non-string variantId", async () => {
    await updateCartQuantity("", 5);
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

describe("removeFromCart", () => {
  it("deletes the given line from the cart", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2, v2: 3 }));
    await removeFromCart("v1");
    expect(cartCookieValue()).toEqual({ v2: 3 });
  });

  it("silently no-ops for an empty/non-string variantId", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    mockCookieStore.set.mockClear();
    await removeFromCart("");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

describe("removeManyFromCart", () => {
  it("deletes every given line", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2, v2: 3, v3: 1 }));
    await removeManyFromCart(["v1", "v3"]);
    expect(cartCookieValue()).toEqual({ v2: 3 });
  });

  it("silently no-ops when passed something other than an array (raw action call)", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    mockCookieStore.set.mockClear();
    // @ts-expect-error -- exercising a raw Server Action call with a bad type
    await removeManyFromCart("v1");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});

describe("clearCart", () => {
  it("empties the cart", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    await clearCart();
    expect(cartCookieValue()).toEqual({});
  });
});

describe("cart mutations revalidate the storefront layout", () => {
  it("calls revalidatePath after every mutation", async () => {
    mockRevalidatePath.mockClear();
    await addToCart("v1", 1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
