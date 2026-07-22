import { describe, it, expect } from "vitest";
import {
  mapCategory,
  mapProduct,
  mapVariant,
  mapAddress,
  mapOrderItem,
  mapOrder,
  mapStaff,
  mapCoupon,
} from "./mappers";

describe("mapCategory", () => {
  it("maps a full row", () => {
    expect(
      mapCategory({
        id: "c1",
        slug: "seeds",
        name: "Seeds",
        description: "desc",
        image_url: "img.png",
        parent_id: "c0",
        sort_order: 3,
      })
    ).toEqual({
      id: "c1",
      slug: "seeds",
      name: "Seeds",
      description: "desc",
      imageUrl: "img.png",
      parentId: "c0",
      sortOrder: 3,
    });
  });

  it("defaults optional fields when absent", () => {
    const result = mapCategory({ id: "c1", slug: "seeds", name: "Seeds", parent_id: null });
    expect(result.description).toBeUndefined();
    expect(result.imageUrl).toBeUndefined();
    expect(result.parentId).toBeNull();
    expect(result.sortOrder).toBe(0);
  });
});

describe("mapProduct", () => {
  it("maps a full row including regulated-agrochemical fields", () => {
    const result = mapProduct({
      id: "p1",
      slug: "taqat",
      name: "Taqat",
      brand: "Tata Rallis",
      category_id: "c1",
      description: "d",
      images: ["a.jpg"],
      status: "active",
      crop_compatibility: ["Cotton"],
      active_ingredient: "Profenofos",
      composition: "40% EC",
      usage_instructions: "Dilute",
      registration_number: "REG-1",
      hsn_code: "38089199",
      is_bestseller: true,
    });
    expect(result).toMatchObject({
      id: "p1",
      activeIngredient: "Profenofos",
      isBestseller: true,
      cropCompatibility: ["Cotton"],
    });
  });

  it("defaults images/cropCompatibility to empty arrays and coerces isBestseller", () => {
    const result = mapProduct({
      id: "p1",
      slug: "taqat",
      name: "Taqat",
      brand: "Tata Rallis",
      category_id: "c1",
      description: "d",
      status: "draft",
      is_bestseller: null,
    });
    expect(result.images).toEqual([]);
    expect(result.cropCompatibility).toEqual([]);
    expect(result.isBestseller).toBe(false);
    expect(result.activeIngredient).toBeUndefined();
  });
});

describe("mapVariant", () => {
  it("coerces numeric columns and maps optional agrochemical batch fields", () => {
    const result = mapVariant({
      id: "v1",
      product_id: "p1",
      sku: "SKU-1",
      label: "500 ml",
      pack_size: "500",
      unit: "ml",
      price: "820",
      mrp: "920",
      stock_qty: 18,
      batch_number: "B1",
      mfg_date: "2026-01-01",
      expiry_date: "2027-01-01",
    });
    expect(result).toEqual({
      id: "v1",
      productId: "p1",
      sku: "SKU-1",
      label: "500 ml",
      packSize: 500,
      unit: "ml",
      price: 820,
      mrp: 920,
      stockQty: 18,
      batchNumber: "B1",
      mfgDate: "2026-01-01",
      expiryDate: "2027-01-01",
    });
  });

  it("leaves batch fields undefined when absent", () => {
    const result = mapVariant({
      id: "v1",
      product_id: "p1",
      sku: "SKU-1",
      label: "1 kg",
      pack_size: 1,
      unit: "kg",
      price: 100,
      mrp: 120,
      stock_qty: 5,
    });
    expect(result.batchNumber).toBeUndefined();
    expect(result.mfgDate).toBeUndefined();
    expect(result.expiryDate).toBeUndefined();
  });
});

describe("mapAddress", () => {
  it("maps a full row", () => {
    const result = mapAddress({
      id: "a1",
      customer_id: "cu1",
      full_name: "Ravi",
      phone: "9876543210",
      line1: "Farm Road",
      line2: "Near tank",
      village: "Anandapur",
      district: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522001",
    });
    expect(result).toEqual({
      id: "a1",
      customerId: "cu1",
      fullName: "Ravi",
      phone: "9876543210",
      line1: "Farm Road",
      line2: "Near tank",
      village: "Anandapur",
      district: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522001",
    });
  });

  it("defaults line2/village to undefined when absent", () => {
    const result = mapAddress({
      id: "a1",
      customer_id: "cu1",
      full_name: "Ravi",
      phone: "9876543210",
      line1: "Farm Road",
      district: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522001",
    });
    expect(result.line2).toBeUndefined();
    expect(result.village).toBeUndefined();
  });
});

describe("mapOrderItem", () => {
  it("maps a row and coerces price", () => {
    expect(
      mapOrderItem({
        id: "i1",
        order_id: "o1",
        variant_id: "v1",
        product_name: "Taqat",
        variant_label: "500 ml",
        quantity: 2,
        price_at_purchase: "820",
      })
    ).toEqual({
      id: "i1",
      orderId: "o1",
      variantId: "v1",
      productName: "Taqat",
      variantLabel: "500 ml",
      quantity: 2,
      priceAtPurchase: 820,
    });
  });
});

describe("mapOrder", () => {
  it("assembles items/address and coerces money fields", () => {
    const items = [mapOrderItem({ id: "i1", order_id: "o1", variant_id: "v1", product_name: "Taqat", variant_label: "500 ml", quantity: 1, price_at_purchase: 820 })];
    const address = mapAddress({ id: "a1", customer_id: "cu1", full_name: "Ravi", phone: "9876543210", line1: "Farm Road", district: "Guntur", state: "AP", pincode: "522001" });
    const result = mapOrder(
      { id: "o1", customer_id: "cu1", status: "pending", subtotal: "820", discount: "0", total: "820", coupon_code: "SAVE10", created_at: "2026-07-01T00:00:00.000Z" },
      items,
      address
    );
    expect(result).toEqual({
      id: "o1",
      customerId: "cu1",
      status: "pending",
      items,
      subtotal: 820,
      discount: 0,
      total: 820,
      shippingAddress: address,
      couponCode: "SAVE10",
      createdAt: "2026-07-01T00:00:00.000Z",
    });
  });

  it("leaves couponCode undefined when absent", () => {
    const result = mapOrder(
      { id: "o1", customer_id: "cu1", status: "pending", subtotal: 0, discount: 0, total: 0, created_at: "2026-07-01T00:00:00.000Z" },
      [],
      mapAddress({ id: "a1", customer_id: "cu1", full_name: "Ravi", phone: "9876543210", line1: "L1", district: "D", state: "S", pincode: "P" })
    );
    expect(result.couponCode).toBeUndefined();
  });
});

describe("mapStaff", () => {
  it("maps a full row", () => {
    expect(
      mapStaff({ id: "s1", name: "Admin", email: "admin@example.com", password_hash: "hash", role: "admin", active: true })
    ).toEqual({ id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true });
  });
});

describe("mapCoupon", () => {
  it("maps a full row and coerces numeric fields", () => {
    expect(
      mapCoupon({ id: "cp1", code: "SAVE10", type: "percent", value: "10", min_order_value: "500", expires_at: "2026-12-31", active: true })
    ).toEqual({ id: "cp1", code: "SAVE10", type: "percent", value: 10, minOrderValue: 500, expiresAt: "2026-12-31", active: true });
  });

  it("leaves expiresAt undefined when absent", () => {
    const result = mapCoupon({ id: "cp1", code: "SAVE10", type: "flat", value: 50, min_order_value: 0, active: false });
    expect(result.expiresAt).toBeUndefined();
  });
});
