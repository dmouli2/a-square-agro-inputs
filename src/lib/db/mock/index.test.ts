import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockDb, resetMockOrders } from "./index";
import type { CreateOrderInput } from "@/types";

const baseOrderInput: CreateOrderInput = {
  customer: { fullName: "Ravi", phone: "9876543210" },
  address: { fullName: "Ravi", phone: "9876543210", line1: "Farm Road", district: "Guntur", state: "AP", pincode: "522001" },
  items: [{ variantId: "var-1a", quantity: 1 }],
};

describe("createMockDb", () => {
  beforeEach(() => {
    resetMockOrders();
  });

  describe("categories", () => {
    it("list returns the static category list", async () => {
      const db = createMockDb();
      const categories = await db.categories.list();
      expect(categories.length).toBeGreaterThan(0);
    });

    it("findBySlug finds an existing category and returns null otherwise", async () => {
      const db = createMockDb();
      expect((await db.categories.findBySlug("seeds"))?.slug).toBe("seeds");
      expect(await db.categories.findBySlug("missing")).toBeNull();
    });

    it("findById finds an existing category and returns null otherwise", async () => {
      const db = createMockDb();
      const category = await db.categories.create({ slug: "compost", name: "Compost", parentId: null });
      expect((await db.categories.findById(category.id))?.name).toBe("Compost");
      expect(await db.categories.findById("missing")).toBeNull();
    });

    it("create adds a category with a generated id and rejects a duplicate slug", async () => {
      const db = createMockDb();
      const created = await db.categories.create({ slug: "compost", name: "Compost", parentId: null, sortOrder: 5 });
      expect(created.id).toMatch(/^CAT-/);
      expect((await db.categories.list()).some((c) => c.id === created.id)).toBe(true);
      await expect(db.categories.create({ slug: "compost", name: "Compost 2", parentId: null })).rejects.toThrow(
        "duplicate key"
      );
    });

    it("update patches an existing category, rejects a slug collision, and throws for an unknown id", async () => {
      const db = createMockDb();
      const created = await db.categories.create({ slug: "compost", name: "Compost", parentId: null });
      const updated = await db.categories.update(created.id, { name: "Organic Compost" });
      expect(updated.name).toBe("Organic Compost");
      await expect(db.categories.update(created.id, { slug: "seeds" })).rejects.toThrow("duplicate key");
      await expect(db.categories.update("missing", { name: "X" })).rejects.toThrow("Category missing not found");
    });

    it("delete removes a category with no products, and rejects one still in use", async () => {
      const db = createMockDb();
      const created = await db.categories.create({ slug: "compost", name: "Compost", parentId: null });
      await db.categories.delete(created.id);
      expect(await db.categories.findById(created.id)).toBeNull();
      await expect(db.categories.delete("cat-seeds")).rejects.toThrow("foreign key constraint");
    });
  });

  describe("products", () => {
    it("list only returns active products", async () => {
      const db = createMockDb();
      const results = await db.products.list();
      expect(results.every((p) => p.status === "active")).toBe(true);
    });

    it("list filters by categorySlug", async () => {
      const db = createMockDb();
      const results = await db.products.list({ categorySlug: "fertilizers" });
      expect(results.every((p) => p.categoryId === "cat-fertilizers")).toBe(true);
    });

    it("list filters by a case-insensitive search term against name/brand", async () => {
      const db = createMockDb();
      const results = await db.products.list({ search: "taqat" });
      expect(results.some((p) => p.slug === "taqat-insecticide")).toBe(true);
    });

    it("listAll returns every product regardless of status", async () => {
      const db = createMockDb();
      expect((await db.products.listAll()).length).toBeGreaterThan(0);
    });

    it("findBySlug/findById/findByVariantId resolve or return null", async () => {
      const db = createMockDb();
      expect((await db.products.findBySlug("taqat-insecticide"))?.id).toBe("prod-1");
      expect(await db.products.findBySlug("missing")).toBeNull();
      expect((await db.products.findById("prod-1"))?.slug).toBe("taqat-insecticide");
      expect(await db.products.findById("missing")).toBeNull();
      expect((await db.products.findByVariantId("var-1a"))?.id).toBe("prod-1");
      expect(await db.products.findByVariantId("missing")).toBeNull();
    });

    it("create adds a new product with generated ids for its variants", async () => {
      const db = createMockDb();
      const created = await db.products.create(
        { slug: "new-seed", name: "New Seed", brand: "Brand", categoryId: "cat-seeds", description: "d", images: [], status: "active", cropCompatibility: [], isBestseller: false },
        [{ sku: "SKU-X", label: "1 kg", packSize: 1, unit: "kg", price: 100, mrp: 120, stockQty: 10 }]
      );
      expect(created.id).toMatch(/^PROD-/);
      expect(created.variants[0].id).toMatch(/^VAR-/);
      expect((await db.products.findById(created.id))?.slug).toBe("new-seed");
    });

    it("update mutates an existing product and throws for an unknown id", async () => {
      const db = createMockDb();
      const updated = await db.products.update("prod-1", { name: "Renamed" });
      expect(updated.name).toBe("Renamed");
      await expect(db.products.update("missing", { name: "X" })).rejects.toThrow("Product missing not found");
    });

    it("createVariant appends a variant and throws for an unknown product", async () => {
      const db = createMockDb();
      const variant = await db.products.createVariant("prod-1", { sku: "SKU-NEW", label: "2 kg", packSize: 2, unit: "kg", price: 200, mrp: 220, stockQty: 4 });
      expect(variant.productId).toBe("prod-1");
      await expect(
        db.products.createVariant("missing", { sku: "SKU-Y", label: "1 kg", packSize: 1, unit: "kg", price: 10, mrp: 12, stockQty: 1 })
      ).rejects.toThrow("Product missing not found");
    });

    it("updateVariant patches an existing variant and throws for an unknown one", async () => {
      const db = createMockDb();
      const updated = await db.products.updateVariant("var-1a", { price: 999 });
      expect(updated.price).toBe(999);
      await expect(db.products.updateVariant("missing", { price: 1 })).rejects.toThrow("Variant missing not found");
    });

    it("deleteVariant removes a variant and is a no-op for an unknown product", async () => {
      const db = createMockDb();
      await db.products.deleteVariant("var-1a");
      const product = await db.products.findById("prod-1");
      expect(product?.variants.some((v) => v.id === "var-1a")).toBe(false);
      await expect(db.products.deleteVariant("missing")).resolves.toBeUndefined();
    });
  });

  describe("orders", () => {
    it("create builds an order, upserting the customer by phone", async () => {
      const db = createMockDb();
      const order = await db.orders.create(baseOrderInput);
      expect(order.id).toMatch(/^ORD-/);
      expect(order.items[0].variantId).toBe("var-1a");
      expect(order.total).toBe(order.subtotal);
    });

    it("create reuses an existing customer record for a repeat phone number", async () => {
      const db = createMockDb();
      await db.orders.create(baseOrderInput);
      const second = await db.orders.create({ ...baseOrderInput, customer: { ...baseOrderInput.customer, fullName: "Ravi Updated" } });
      const byPhone = await db.orders.listByPhone("9876543210");
      expect(byPhone).toHaveLength(2);
      expect(second.customerId).toBe(byPhone[0].customerId);
    });

    it("create updates the stored email when a repeat customer supplies a new one", async () => {
      const db = createMockDb();
      await db.orders.create(baseOrderInput);
      await db.orders.create({
        ...baseOrderInput,
        customer: { ...baseOrderInput.customer, email: "ravi@example.com" },
      });
      const [customer] = await db.customers.list();
      expect(customer.email).toBe("ravi@example.com");
    });

    it("create throws when a cart item references a variant that doesn't exist", async () => {
      const db = createMockDb();
      await expect(db.orders.create({ ...baseOrderInput, items: [{ variantId: "missing", quantity: 1 }] })).rejects.toThrow("Variant missing not found");
    });

    it("create rejects a quantity that exceeds current stock", async () => {
      const db = createMockDb();
      await expect(
        db.orders.create({ ...baseOrderInput, items: [{ variantId: "var-1a", quantity: 1000 }] })
      ).rejects.toThrow("One or more items in your cart exceed available stock.");
    });

    it("list returns orders newest first", async () => {
      // Two orders created back-to-back can land in the same millisecond,
      // making createdAt ties depend on sort stability rather than the
      // ordering logic under test — pin the clock so the timestamps differ.
      vi.useFakeTimers();
      const db = createMockDb();
      vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
      const first = await db.orders.create(baseOrderInput);
      vi.setSystemTime(new Date("2026-07-01T00:00:01.000Z"));
      const second = await db.orders.create(baseOrderInput);
      vi.useRealTimers();

      const list = await db.orders.list();
      expect(list[0].id).toBe(second.id);
      expect(list[1].id).toBe(first.id);
    });

    it("findById resolves an existing order and returns null otherwise", async () => {
      const db = createMockDb();
      const order = await db.orders.create(baseOrderInput);
      expect((await db.orders.findById(order.id))?.id).toBe(order.id);
      expect(await db.orders.findById("missing")).toBeNull();
    });

    it("listByPhone returns an empty array for an unknown phone", async () => {
      const db = createMockDb();
      expect(await db.orders.listByPhone("0000000000")).toEqual([]);
    });

    it("updateStatus mutates the order's status and throws for an unknown id", async () => {
      const db = createMockDb();
      const order = await db.orders.create(baseOrderInput);
      const updated = await db.orders.updateStatus(order.id, "confirmed");
      expect(updated.status).toBe("confirmed");
      await expect(db.orders.updateStatus("missing", "confirmed")).rejects.toThrow("Order missing not found");
    });
  });

  describe("coupons", () => {
    it("findByCode always resolves to null (no coupon data seeded yet)", async () => {
      const db = createMockDb();
      expect(await db.coupons.findByCode("SAVE10")).toBeNull();
    });
  });

  describe("staff", () => {
    it("findByEmail/findById resolve the seeded admin account", async () => {
      const db = createMockDb();
      expect((await db.staff.findByEmail("admin@asquareagro.com"))?.role).toBe("admin");
      expect(await db.staff.findByEmail("missing@example.com")).toBeNull();
      expect((await db.staff.findById("STAFF-1"))?.email).toBe("admin@asquareagro.com");
      expect(await db.staff.findById("missing")).toBeNull();
    });
  });

  describe("customers", () => {
    it("list aggregates order count, spend (excluding cancelled/returned) and last order date per customer", async () => {
      // Pin the clock so the two orders get distinct createdAt timestamps —
      // otherwise same-millisecond creation makes lastOrderAt's ">" comparison
      // depend on iteration order rather than the logic under test.
      vi.useFakeTimers();
      const db = createMockDb();
      vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
      const first = await db.orders.create(baseOrderInput);
      vi.setSystemTime(new Date("2026-07-01T00:00:01.000Z"));
      const second = await db.orders.create(baseOrderInput);
      vi.useRealTimers();
      await db.orders.updateStatus(second.id, "cancelled");

      const [customer] = await db.customers.list();
      expect(customer.orderCount).toBe(2);
      expect(customer.totalSpent).toBe(first.total);
      expect(customer.lastOrderAt).toBe(second.createdAt);
    });

    it("list returns an empty array when there are no customers yet", async () => {
      const db = createMockDb();
      expect(await db.customers.list()).toEqual([]);
    });

    it("keeps the running-latest order date when an earlier order is created after a later one", async () => {
      vi.useFakeTimers();
      const db = createMockDb();
      vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
      const later = await db.orders.create(baseOrderInput);
      vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
      await db.orders.create(baseOrderInput);
      vi.useRealTimers();

      const [customer] = await db.customers.list();
      expect(customer.lastOrderAt).toBe(later.createdAt);
    });

    it("list sorts customers by their most recent order, newest first", async () => {
      // Pin the clock so the two customers' orders land on distinct
      // timestamps — same-millisecond creation would make the sort's
      // outcome depend on insertion order rather than the comparator.
      vi.useFakeTimers();
      const db = createMockDb();
      vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
      await db.orders.create(baseOrderInput);
      vi.setSystemTime(new Date("2026-07-10T00:00:00.000Z"));
      await db.orders.create({ ...baseOrderInput, customer: { fullName: "Other", phone: "9000000000" } });
      vi.useRealTimers();

      const customers = await db.customers.list();
      expect(customers.map((c) => c.phone)).toEqual(["9000000000", "9876543210"]);
    });
  });

  it("resetMockOrders wipes accumulated state so each test starts fresh", async () => {
    const db = createMockDb();
    await db.orders.create(baseOrderInput);
    expect((await db.orders.list()).length).toBeGreaterThan(0);
    resetMockOrders();
    expect((await createMockDb().orders.list()).length).toBe(0);
  });
});
