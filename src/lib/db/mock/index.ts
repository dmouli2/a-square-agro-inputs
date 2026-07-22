import bcrypt from "bcryptjs";
import type { Database } from "@/lib/db/types";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import type { Address, Customer, Order, OrderItem, ProductWithVariants, Staff } from "@/types";

interface MockStore {
  products: ProductWithVariants[];
  orders: Order[];
  customers: Customer[];
  nextOrderId: number;
  nextCustomerId: number;
  nextAddressId: number;
  nextProductId: number;
  nextVariantId: number;
}

const MOCK_STAFF: Staff[] = [
  {
    id: "STAFF-1",
    name: "Admin",
    email: "admin@asquareagro.com",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    active: true,
  },
];

// Next.js compiles Route Handlers, Server Actions and RSC page renders as
// separate module layers — a plain module-level `let` can end up duplicated
// across them, silently losing state between actions and the pages that
// read it back. globalThis is the standard workaround (same pattern as the
// Prisma-client-singleton trick) since it's a true per-process singleton.
function getStore(): MockStore {
  const g = globalThis as typeof globalThis & { __a2MockStore?: MockStore };
  if (!g.__a2MockStore) {
    g.__a2MockStore = {
      products: PRODUCTS.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) })),
      orders: [],
      customers: [],
      nextOrderId: 1,
      nextCustomerId: 1,
      nextAddressId: 1,
      nextProductId: 1,
      nextVariantId: 1,
    };
  }
  return g.__a2MockStore;
}

function findProductByVariantId(products: ProductWithVariants[], variantId: string) {
  return products.find((p) => p.variants.some((v) => v.id === variantId)) ?? null;
}

function upsertCustomer(fullName: string, phone: string, email?: string): Customer {
  const store = getStore();
  const existing = store.customers.find((c) => c.phone === phone);
  if (existing) {
    existing.fullName = fullName;
    if (email) existing.email = email;
    return existing;
  }
  const created: Customer = { id: `CUST-${store.nextCustomerId++}`, fullName, phone, email };
  store.customers.push(created);
  return created;
}

export function createMockDb(): Database {
  return {
    categories: {
      async list() {
        return CATEGORIES;
      },
      async findBySlug(slug) {
        return CATEGORIES.find((c) => c.slug === slug) ?? null;
      },
    },
    products: {
      async list(params) {
        let results = getStore().products.filter((p) => p.status === "active");
        if (params?.categorySlug) {
          const category = CATEGORIES.find((c) => c.slug === params.categorySlug);
          results = results.filter((p) => p.categoryId === category?.id);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          results = results.filter(
            (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
          );
        }
        return results;
      },
      async listAll() {
        return getStore().products;
      },
      async findBySlug(slug) {
        return getStore().products.find((p) => p.slug === slug) ?? null;
      },
      async findById(id) {
        return getStore().products.find((p) => p.id === id) ?? null;
      },
      async findByVariantId(variantId) {
        return findProductByVariantId(getStore().products, variantId);
      },
      async create(product, variants) {
        const store = getStore();
        const id = `PROD-${store.nextProductId++}`;
        const created: ProductWithVariants = {
          ...product,
          id,
          variants: variants.map((v) => ({ ...v, id: `VAR-${store.nextVariantId++}`, productId: id })),
        };
        store.products.push(created);
        return created;
      },
      async update(id, patch) {
        const store = getStore();
        const product = store.products.find((p) => p.id === id);
        if (!product) throw new Error(`Product ${id} not found`);
        Object.assign(product, patch);
        return product;
      },
      async createVariant(productId, variant) {
        const store = getStore();
        const product = store.products.find((p) => p.id === productId);
        if (!product) throw new Error(`Product ${productId} not found`);
        const created = { ...variant, id: `VAR-${store.nextVariantId++}`, productId };
        product.variants.push(created);
        return created;
      },
      async updateVariant(variantId, patch) {
        const store = getStore();
        const product = findProductByVariantId(store.products, variantId);
        const variant = product?.variants.find((v) => v.id === variantId);
        if (!variant) throw new Error(`Variant ${variantId} not found`);
        Object.assign(variant, patch);
        return variant;
      },
      async deleteVariant(variantId) {
        const store = getStore();
        const product = findProductByVariantId(store.products, variantId);
        if (!product) return;
        product.variants = product.variants.filter((v) => v.id !== variantId);
      },
    },
    orders: {
      async create(input) {
        const store = getStore();
        const customer = upsertCustomer(input.customer.fullName, input.customer.phone, input.customer.email);

        const orderId = `ORD-${1000 + store.nextOrderId++}`;
        const items: OrderItem[] = input.items.map((cartItem) => {
          const product = findProductByVariantId(store.products, cartItem.variantId);
          const variant = product?.variants.find((v) => v.id === cartItem.variantId);
          if (!product || !variant) {
            throw new Error(`Variant ${cartItem.variantId} not found`);
          }
          return {
            id: `ITEM-${cartItem.variantId}-${Date.now()}`,
            orderId,
            variantId: variant.id,
            productName: product.name,
            variantLabel: variant.label,
            quantity: cartItem.quantity,
            priceAtPurchase: variant.price,
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
        const discount = 0;
        const address: Address = {
          id: `ADDR-${store.nextAddressId++}`,
          customerId: customer.id,
          ...input.address,
        };

        const created: Order = {
          id: orderId,
          customerId: customer.id,
          status: "pending",
          items,
          subtotal,
          discount,
          total: subtotal - discount,
          shippingAddress: address,
          couponCode: input.couponCode,
          createdAt: new Date().toISOString(),
        };
        store.orders.push(created);
        return created;
      },
      async list() {
        return [...getStore().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      async findById(id) {
        return getStore().orders.find((o) => o.id === id) ?? null;
      },
      async listByPhone(phone) {
        const store = getStore();
        const customer = store.customers.find((c) => c.phone === phone);
        if (!customer) return [];
        return store.orders.filter((o) => o.customerId === customer.id);
      },
      async updateStatus(id, status) {
        const order = getStore().orders.find((o) => o.id === id);
        if (!order) throw new Error(`Order ${id} not found`);
        order.status = status;
        return order;
      },
    },
    coupons: {
      async findByCode() {
        return null;
      },
    },
    staff: {
      async findByEmail(email) {
        return MOCK_STAFF.find((s) => s.email === email) ?? null;
      },
      async findById(id) {
        return MOCK_STAFF.find((s) => s.id === id) ?? null;
      },
    },
  };
}

export function resetMockOrders() {
  const g = globalThis as typeof globalThis & { __a2MockStore?: MockStore };
  delete g.__a2MockStore;
}
