import type {
  Category,
  Coupon,
  CreateOrderInput,
  Order,
  Product,
  ProductVariant,
  ProductWithVariants,
  Staff,
} from "@/types";

export interface CategoryRepository {
  list(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
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

export interface Database {
  categories: CategoryRepository;
  products: ProductRepository;
  orders: OrderRepository;
  coupons: CouponRepository;
  staff: StaffRepository;
}
