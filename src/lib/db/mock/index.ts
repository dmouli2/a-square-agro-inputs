import bcrypt from "bcryptjs";
import type { Database } from "@/lib/db/types";
import {
  RATE_LIMIT_MAX_PER_IP,
  RATE_LIMIT_MAX_PER_PHONE,
  RATE_LIMIT_WINDOW_SECONDS,
  LOGIN_RATE_LIMIT_MAX_PER_EMAIL,
  LOGIN_RATE_LIMIT_MAX_PER_IP,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/db/rateLimitConfig";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import type {
  Address,
  Category,
  Customer,
  CustomerSummary,
  ErrorLogEntry,
  Order,
  OrderItem,
  ProductWithVariants,
  Staff,
} from "@/types";

interface CheckoutAttempt {
  ip: string;
  phone: string;
  createdAt: number;
}

interface LoginAttempt {
  ip: string;
  email: string;
  createdAt: number;
}

interface MockStore {
  categories: Category[];
  products: ProductWithVariants[];
  orders: Order[];
  customers: Customer[];
  checkoutAttempts: CheckoutAttempt[];
  loginAttempts: LoginAttempt[];
  errorLogs: ErrorLogEntry[];
  nextOrderId: number;
  nextCustomerId: number;
  nextAddressId: number;
  nextProductId: number;
  nextVariantId: number;
  nextCategoryId: number;
  nextErrorLogId: number;
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
      categories: CATEGORIES.map((c) => ({ ...c })),
      products: PRODUCTS.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) })),
      orders: [],
      customers: [],
      checkoutAttempts: [],
      loginAttempts: [],
      errorLogs: [],
      nextOrderId: 1,
      nextCustomerId: 1,
      nextAddressId: 1,
      nextProductId: 1,
      nextVariantId: 1,
      nextCategoryId: 1,
      nextErrorLogId: 1,
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
        return [...getStore().categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      },
      async findBySlug(slug) {
        return getStore().categories.find((c) => c.slug === slug) ?? null;
      },
      async findById(id) {
        return getStore().categories.find((c) => c.id === id) ?? null;
      },
      async create(input) {
        const store = getStore();
        if (store.categories.some((c) => c.slug === input.slug)) {
          throw new Error(`duplicate key value violates unique constraint "categories_slug_key"`);
        }
        const created: Category = { id: `CAT-${store.nextCategoryId++}`, ...input };
        store.categories.push(created);
        return created;
      },
      async update(id, patch) {
        const store = getStore();
        const category = store.categories.find((c) => c.id === id);
        if (!category) throw new Error(`Category ${id} not found`);
        if (patch.slug && store.categories.some((c) => c.id !== id && c.slug === patch.slug)) {
          throw new Error(`duplicate key value violates unique constraint "categories_slug_key"`);
        }
        Object.assign(category, patch);
        return category;
      },
      async delete(id) {
        const store = getStore();
        // Mirrors the FK restriction the real database enforces.
        if (store.products.some((p) => p.categoryId === id)) {
          throw new Error(`update or delete on table "categories" violates foreign key constraint`);
        }
        store.categories = store.categories.filter((c) => c.id !== id);
      },
    },
    products: {
      async list(params) {
        let results = getStore().products.filter((p) => p.status === "active");
        if (params?.categorySlug) {
          const category = getStore().categories.find((c) => c.slug === params.categorySlug);
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
          if (cartItem.quantity > variant.stockQty) {
            throw new Error("One or more items in your cart exceed available stock.");
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
    customers: {
      async list() {
        const store = getStore();
        return store.customers
          .map((customer): CustomerSummary => {
            const orders = store.orders.filter((o) => o.customerId === customer.id);
            const counted = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
            const lastOrderAt = orders.reduce<string | null>(
              (latest, o) => (latest === null || o.createdAt > latest ? o.createdAt : latest),
              null
            );
            return {
              ...customer,
              orderCount: orders.length,
              totalSpent: counted.reduce((sum, o) => sum + o.total, 0),
              lastOrderAt,
            };
          })
          .sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""));
      },
    },
    rateLimiter: {
      async checkAndRecord({ ip, phone }) {
        const store = getStore();
        const cutoff = Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000;
        store.checkoutAttempts = store.checkoutAttempts.filter((a) => a.createdAt >= cutoff);

        const ipCount = store.checkoutAttempts.filter((a) => a.ip === ip).length;
        const phoneCount = store.checkoutAttempts.filter((a) => a.phone === phone).length;
        const allowed = ipCount < RATE_LIMIT_MAX_PER_IP && phoneCount < RATE_LIMIT_MAX_PER_PHONE;

        store.checkoutAttempts.push({ ip, phone, createdAt: Date.now() });
        return allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: RATE_LIMIT_WINDOW_SECONDS };
      },
    },
    loginRateLimiter: {
      async checkAndRecord({ ip, email }) {
        const store = getStore();
        const cutoff = Date.now() - LOGIN_RATE_LIMIT_WINDOW_SECONDS * 1000;
        store.loginAttempts = store.loginAttempts.filter((a) => a.createdAt >= cutoff);

        const ipCount = store.loginAttempts.filter((a) => a.ip === ip).length;
        const emailCount = store.loginAttempts.filter((a) => a.email === email).length;
        const allowed = ipCount < LOGIN_RATE_LIMIT_MAX_PER_IP && emailCount < LOGIN_RATE_LIMIT_MAX_PER_EMAIL;

        store.loginAttempts.push({ ip, email, createdAt: Date.now() });
        return allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS };
      },
    },
    errorLogs: {
      async create(entry) {
        const store = getStore();
        store.errorLogs.unshift({
          id: `ERR-${store.nextErrorLogId++}`,
          message: entry.message,
          stack: entry.stack,
          context: entry.context,
          path: entry.path,
          createdAt: new Date().toISOString(),
        });
      },
      async list(limit = 100) {
        return getStore().errorLogs.slice(0, limit);
      },
    },
  };
}

export function resetMockOrders() {
  const g = globalThis as typeof globalThis & { __a2MockStore?: MockStore };
  delete g.__a2MockStore;
}
