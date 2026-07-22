import type { Category, Order, ProductWithVariants, Staff } from "@/types";

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    slug: "seeds",
    name: "Seeds",
    description: "Certified seeds",
    parentId: null,
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<ProductWithVariants> = {}): ProductWithVariants {
  return {
    id: "prod-1",
    slug: "hybrid-maize-seed",
    name: "Hybrid Maize Seed",
    brand: "AgriCorp",
    categoryId: "cat-1",
    description: "High-yield hybrid maize seed for kharif sowing.",
    images: ["products/prod-1/photo.jpg"],
    status: "active",
    cropCompatibility: ["Maize"],
    activeIngredient: undefined,
    composition: undefined,
    usageInstructions: undefined,
    registrationNumber: undefined,
    hsnCode: undefined,
    isBestseller: false,
    variants: [
      {
        id: "var-1",
        productId: "prod-1",
        sku: "SKU-1",
        label: "1 kg",
        packSize: 1,
        unit: "kg",
        price: 500,
        mrp: 600,
        stockQty: 20,
      },
    ],
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ORD-1",
    customerId: "cust-1",
    status: "pending",
    items: [
      {
        id: "item-1",
        orderId: "ORD-1",
        variantId: "var-1",
        productName: "Hybrid Maize Seed",
        variantLabel: "1 kg",
        quantity: 2,
        priceAtPurchase: 500,
      },
    ],
    subtotal: 1000,
    discount: 0,
    total: 1000,
    shippingAddress: {
      id: "addr-1",
      customerId: "cust-1",
      fullName: "Ramesh Kumar",
      phone: "9876543210",
      line1: "123 Farm Road",
      village: "Kothapalli",
      district: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522001",
    },
    createdAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: "staff-1",
    name: "Admin User",
    email: "admin@asquareagro.com",
    passwordHash: "hashed",
    role: "admin",
    active: true,
    ...overrides,
  };
}
