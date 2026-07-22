import { describe, it, expect, vi } from "vitest";
import { createSupabaseDb } from "./index";

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient: vi.fn() }));

describe("createSupabaseDb", () => {
  it("wires real Supabase repositories for categories/products/orders/staff, and reuses the mock coupons repository", () => {
    const db = createSupabaseDb();
    expect(db.categories).toBeDefined();
    expect(db.products).toBeDefined();
    expect(db.orders).toBeDefined();
    expect(db.staff).toBeDefined();
    // Coupons have no real table yet — createSupabaseDb intentionally
    // borrows the mock adapter's always-null implementation for that port.
    expect(db.coupons).toBeDefined();
    expect(db.rateLimiter).toBeDefined();
    expect(db.errorLogs).toBeDefined();
  });

  it("coupons.findByCode resolves to null (no real coupon adapter yet)", async () => {
    const db = createSupabaseDb();
    await expect(db.coupons.findByCode("SAVE10")).resolves.toBeNull();
  });
});
