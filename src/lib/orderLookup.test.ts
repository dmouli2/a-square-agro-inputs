import { describe, it, expect, beforeEach } from "vitest";
import { mockCookieStore } from "../../vitest.setup";
import { PHONE_COOKIE, getRememberedPhone, isValidPhone } from "./orderLookup";

describe("isValidPhone", () => {
  it("accepts a 10-digit Indian mobile number", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("6000000000")).toBe(true);
  });

  it("rejects wrong lengths, bad leading digits, and non-strings", () => {
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("1234567890")).toBe(false);
    expect(isValidPhone("98765432101")).toBe(false);
    expect(isValidPhone("98765abcde")).toBe(false);
    expect(isValidPhone(9876543210)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });
});

describe("getRememberedPhone", () => {
  beforeEach(() => {
    mockCookieStore.delete(PHONE_COOKIE);
  });

  it("returns the phone stored in the cookie", async () => {
    mockCookieStore.set(PHONE_COOKIE, "9876543210");
    expect(await getRememberedPhone()).toBe("9876543210");
  });

  it("returns null when no cookie is set", async () => {
    expect(await getRememberedPhone()).toBeNull();
  });

  it("returns null when the cookie holds a tampered/invalid value", async () => {
    mockCookieStore.set(PHONE_COOKIE, "not-a-phone");
    expect(await getRememberedPhone()).toBeNull();
  });
});
