import type {
  Category,
  Coupon,
  CreateOrderInput,
  CustomerSummary,
  ErrorLogEntry,
  Order,
  Product,
  ProductVariant,
  ProductWithVariants,
  RateLimitResult,
  Staff,
} from "@/types";

export interface CategoryRepository {
  list(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
  create(input: Omit<Category, "id">): Promise<Category>;
  update(id: string, patch: Partial<Omit<Category, "id">>): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface CustomerRepository {
  list(): Promise<CustomerSummary[]>;
}

export interface ProductRepository {
  list(params?: { categorySlug?: string; search?: string }): Promise<ProductWithVariants[]>;
  listAll(): Promise<ProductWithVariants[]>;
  findBySlug(slug: string): Promise<ProductWithVariants | null>;
  findById(id: string): Promise<ProductWithVariants | null>;
  findByVariantId(variantId: string): Promise<ProductWithVariants | null>;
  create(product: Omit<Product, "id">, variants: Omit<ProductVariant, "id" | "productId">[]): Promise<ProductWithVariants>;
  update(id: string, patch: Partial<Product>): Promise<ProductWithVariants>;
  createVariant(productId: string, variant: Omit<ProductVariant, "id" | "productId">): Promise<ProductVariant>;
  updateVariant(variantId: string, patch: Partial<Omit<ProductVariant, "id" | "productId">>): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  list(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  listByPhone(phone: string): Promise<Order[]>;
  updateStatus(id: string, status: Order["status"]): Promise<Order>;
}

export interface CouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
}

export interface StaffRepository {
  findByEmail(email: string): Promise<Staff | null>;
  findById(id: string): Promise<Staff | null>;
}

/** Backs the checkout flood/bot-protection guard — see src/app/actions/checkout.ts. */
export interface RateLimiterRepository {
  /** Records this attempt and reports whether it's within the allowed rate for this ip/phone pair. */
  checkAndRecord(input: { ip: string; phone: string }): Promise<RateLimitResult>;
}

/** Lightweight in-house error monitoring — see src/lib/errorLog.ts and /admin/errors. */
export interface ErrorLogRepository {
  create(entry: { message: string; stack?: string; context?: Record<string, unknown>; path?: string }): Promise<void>;
  list(limit?: number): Promise<ErrorLogEntry[]>;
}

/** Backs admin login brute-force protection — see src/app/actions/auth.ts. */
export interface LoginRateLimiterRepository {
  /** Records this attempt and reports whether it's within the allowed rate for this ip/email pair. */
  checkAndRecord(input: { ip: string; email: string }): Promise<RateLimitResult>;
}

export interface Database {
  categories: CategoryRepository;
  products: ProductRepository;
  orders: OrderRepository;
  coupons: CouponRepository;
  staff: StaffRepository;
  customers: CustomerRepository;
  rateLimiter: RateLimiterRepository;
  loginRateLimiter: LoginRateLimiterRepository;
  errorLogs: ErrorLogRepository;
}
