export type ProductStatus = "draft" | "active" | "archived";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
}

/**
 * A sellable product line, e.g. "Tata Rallis Taqat Insecticide".
 * Pricing/stock live on ProductVariant — a product is a family of pack sizes.
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  images: string[];
  status: ProductStatus;
  cropCompatibility: string[];
  activeIngredient?: string;
  composition?: string;
  usageInstructions?: string;
  /** CIB&RC registration number — required label info for regulated agrochemicals in India. */
  registrationNumber?: string;
  hsnCode?: string;
  /** Admin-set flag — shows the "Bestseller" ribbon on the storefront. Not derived from sales data. */
  isBestseller: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  label: string;
  packSize: number;
  unit: "g" | "kg" | "ml" | "L" | "packet" | "piece";
  price: number;
  mrp: number;
  stockQty: number;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface CartItem {
  variantId: string;
  quantity: number;
}

export interface Address {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  village?: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  couponCode?: string;
  createdAt: string;
}

export interface GuestContact {
  fullName: string;
  phone: string;
  email?: string;
}

export interface CreateOrderInput {
  customer: GuestContact;
  address: Omit<Address, "id" | "customerId">;
  items: CartItem[];
  couponCode?: string;
}

export type StaffRole = "admin";

export interface Staff {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: StaffRole;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrderValue: number;
  expiresAt?: string;
  active: boolean;
}
