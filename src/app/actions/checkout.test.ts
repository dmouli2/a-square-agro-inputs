import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockCookieStore, mockRevalidatePath } from "../../../vitest.setup";
import { getDb } from "@/lib/db";
import { CART_COOKIE } from "@/lib/cart";
import { PHONE_COOKIE } from "@/lib/orderLookup";
import { placeOrder } from "./checkout";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const validAddress = {
  fullName: "Ravi Kumar",
  phone: "9876543210",
  line1: "Farm Road",
  district: "Guntur",
  state: "Andhra Pradesh",
  pincode: "522001",
};

describe("placeOrder", () => {
  const create = vi.fn();

  beforeEach(() => {
    create.mockReset();
    vi.mocked(getDb).mockReturnValue({ orders: { create } } as never);
    mockCookieStore.set.mockClear();
    mockCookieStore.delete.mockClear();
    mockRevalidatePath.mockClear();
  });

  it("rejects an empty cart before validating any address field", async () => {
    const result = await placeOrder({ error: null }, formData(validAddress));
    expect(result.error).toBe("Your cart is empty.");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects when required address fields are missing", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    const result = await placeOrder({ error: null }, formData({ fullName: "Ravi" }));
    expect(result.error).toMatch(/fill in your name/i);
  });

  it("rejects an invalid phone number", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    const result = await placeOrder({ error: null }, formData({ ...validAddress, phone: "12345" }));
    expect(result.error).toMatch(/valid 10-digit phone number/i);
  });

  it("rejects an invalid pincode", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    const result = await placeOrder({ error: null }, formData({ ...validAddress, pincode: "123" }));
    expect(result.error).toMatch(/valid 6-digit pincode/i);
  });

  it("places the order, clears the cart, and redirects to the confirmation page on success", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 2 }));
    create.mockResolvedValue({ id: "ORD-1001" });
    await expect(placeOrder({ error: null }, formData(validAddress))).rejects.toThrow("NEXT_REDIRECT:/orders/ORD-1001");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({ fullName: "Ravi Kumar", phone: "9876543210" }),
        items: [{ variantId: "v1", quantity: 2 }],
      })
    );
    expect(mockCookieStore.delete).toHaveBeenCalledWith(CART_COOKIE);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("remembers the customer's phone in a cookie for the /orders lookup", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    mockCookieStore.set.mockClear();
    create.mockResolvedValue({ id: "ORD-1003" });
    await placeOrder({ error: null }, formData(validAddress)).catch(() => {});
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      PHONE_COOKIE,
      "9876543210",
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("does not set the phone cookie when order creation fails", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    mockCookieStore.set.mockClear();
    create.mockRejectedValue(new Error("connection refused"));
    await placeOrder({ error: null }, formData(validAddress));
    expect(mockCookieStore.set).not.toHaveBeenCalledWith(PHONE_COOKIE, expect.anything(), expect.anything());
  });

  it("passes optional fields through only when present", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 1 }));
    create.mockResolvedValue({ id: "ORD-1002" });
    await placeOrder({ error: null }, formData({ ...validAddress, email: "ravi@example.com", line2: "Near tank", village: "Anandapur" })).catch(() => {});
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({ email: "ravi@example.com" }),
        address: expect.objectContaining({ line2: "Near tank", village: "Anandapur" }),
      })
    );
  });

  it("surfaces the repository's stock/availability error message to the shopper", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 5 }));
    create.mockRejectedValue(new Error("One or more items in your cart exceed available stock."));
    const result = await placeOrder({ error: null }, formData(validAddress));
    expect(result.error).toBe("One or more items in your cart exceed available stock.");
  });

  it("surfaces the repository's stale-cart-item error message to the shopper", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 5 }));
    create.mockRejectedValue(new Error("One or more cart items are no longer available."));
    const result = await placeOrder({ error: null }, formData(validAddress));
    expect(result.error).toBe("One or more cart items are no longer available.");
  });

  it("falls back to a generic error message for an unexpected failure", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 5 }));
    create.mockRejectedValue(new Error("connection refused"));
    const result = await placeOrder({ error: null }, formData(validAddress));
    expect(result.error).toBe("Something went wrong placing your order. Please try again.");
  });

  it("falls back to a generic error message for a non-Error rejection", async () => {
    mockCookieStore.set(CART_COOKIE, JSON.stringify({ v1: 5 }));
    create.mockRejectedValue("boom");
    const result = await placeOrder({ error: null }, formData(validAddress));
    expect(result.error).toBe("Something went wrong placing your order. Please try again.");
  });
});
