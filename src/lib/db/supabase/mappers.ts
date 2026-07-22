import type { Address, Category, Coupon, Order, OrderItem, Product, ProductVariant, Staff } from "@/types";

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    imageUrl: (row.image_url as string) ?? undefined,
    parentId: (row.parent_id as string | null) ?? null,
  };
}

export function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    brand: row.brand as string,
    categoryId: row.category_id as string,
    description: row.description as string,
    images: (row.images as string[]) ?? [],
    status: row.status as Product["status"],
    cropCompatibility: (row.crop_compatibility as string[]) ?? [],
    activeIngredient: (row.active_ingredient as string) ?? undefined,
    composition: (row.composition as string) ?? undefined,
    usageInstructions: (row.usage_instructions as string) ?? undefined,
    registrationNumber: (row.registration_number as string) ?? undefined,
    hsnCode: (row.hsn_code as string) ?? undefined,
  };
}

export function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    sku: row.sku as string,
    label: row.label as string,
    packSize: Number(row.pack_size),
    unit: row.unit as ProductVariant["unit"],
    price: Number(row.price),
    mrp: Number(row.mrp),
    stockQty: row.stock_qty as number,
    batchNumber: (row.batch_number as string) ?? undefined,
    mfgDate: (row.mfg_date as string) ?? undefined,
    expiryDate: (row.expiry_date as string) ?? undefined,
  };
}

export function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    fullName: row.full_name as string,
    phone: row.phone as string,
    line1: row.line1 as string,
    line2: (row.line2 as string) ?? undefined,
    village: (row.village as string) ?? undefined,
    district: row.district as string,
    state: row.state as string,
    pincode: row.pincode as string,
  };
}

export function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    variantId: row.variant_id as string,
    productName: row.product_name as string,
    variantLabel: row.variant_label as string,
    quantity: row.quantity as number,
    priceAtPurchase: Number(row.price_at_purchase),
  };
}

export function mapOrder(row: Record<string, unknown>, items: OrderItem[], address: Address): Order {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    status: row.status as Order["status"],
    items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    shippingAddress: address,
    couponCode: (row.coupon_code as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function mapStaff(row: Record<string, unknown>): Staff {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    role: row.role as Staff["role"],
    active: row.active as boolean,
  };
}

export function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    type: row.type as Coupon["type"],
    value: Number(row.value),
    minOrderValue: Number(row.min_order_value),
    expiresAt: (row.expires_at as string) ?? undefined,
    active: row.active as boolean,
  };
}
