import { describe, it, expect } from "vitest";
import { mockCookieStore } from "../../vitest.setup";
import { getCartMap, getCartCount, isValidQuantity, CART_COOKIE, MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY } from "./cart";

describe("isValidQuantity", () => {
  it("accepts integers within [1, MAX_ITEM_QUANTITY]", () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(500)).toBe(true);
    expect(isValidQuantity(MAX_ITEM_QUANTITY)).toBe(true);
  });

  it("rejects zero, negative, fractional, non-finite and over-cap values", () => {
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-5)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
    expect(isValidQuantity(Infinity)).toBe(false);
    expect(isValidQuantity(MAX_ITEM_QUANTITY + 1)).toBe(false);
  });

  it("rejects non-number types a raw Server Action call could smuggle in", () => {
    expect(isValidQuantity("5")).toBe(false);
    expect(isValidQuantity(null)).toBe(false);
    expect(isValidQuantity(undefined)).toBe(false);
    expect(isValidQuantity({})).toBe(false);
  });
});

describe("getCartMap", () => {
  it("returns an empty map when there is no cart cookie", async () => {
    expect(await getCartMap()).toEqual({});
  });

  it("returns an empty map when the cookie is malformed JSON", async () => {
    mockCookieStore.set(CART_COOKIE, "{not-json");
    expect(await getCartMap()).toEqual({});
  });

  it("returns an empty map when the cookie parses to a non-object", async () => {
    mockCookieStore.set(CART_COOKIE, "42");
    expect(await getCartMap()).toEqual({});

    mockCookieStore.set(CART_COOKIE, "null");
    expect(await getCartMap()).toEqual({});
  });

  it("returns valid entries unchanged", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2, v2: 5 }));
    expect(await getCartMap()).toEqual({ v1: 2, v2: 5 });
  });

  it("drops entries with a negative, zero, fractional, or over-cap quantity from a forged cookie", async () => {
    mockCookieStore.set(
      CART_COOKIE,
      JSON.stringify({ v1: 2, v2: -5, v3: 0, v4: 1.5, v5: MAX_ITEM_QUANTITY + 1000 })
    );
    expect(await getCartMap()).toEqual({ v1: 2 });
  });

  it("drops entries with a non-numeric quantity", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: "5" }));
    expect(await getCartMap()).toEqual({});
  });
});

describe("getCartCount", () => {
  it("sums quantities across the cart", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2, v2: 3 }));
    expect(await getCartCount()).toBe(5);
  });

  it("is zero for an empty cart", async () => {
    expect(await getCartCount()).toBe(0);
  });
});

describe("constants", () => {
  it("MIN_ITEM_QUANTITY is 1", () => {
    expect(MIN_ITEM_QUANTITY).toBe(1);
  });
});
