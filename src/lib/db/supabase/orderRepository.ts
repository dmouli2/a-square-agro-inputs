import { getSupabaseClient, isInvalidUuidError } from "@/lib/supabase/client";
import type { OrderRepository } from "@/lib/db/types";
import type { Order } from "@/types";
import { mapAddress, mapOrder, mapOrderItem } from "./mappers";

async function loadOrder(orderId: string) {
  const client = getSupabaseClient();
  const { data: orderRow, error } = await client.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) {
    if (isInvalidUuidError(error)) return null;
    throw error;
  }
  if (!orderRow) return null;

  const [{ data: itemRows, error: itemsError }, { data: addressRow, error: addressError }] = await Promise.all([
    client.from("order_items").select("*").eq("order_id", orderId),
    client.from("addresses").select("*").eq("id", orderRow.shipping_address_id).single(),
  ]);
  if (itemsError) throw itemsError;
  if (addressError) throw addressError;

  return mapOrder(orderRow, (itemRows ?? []).map(mapOrderItem), mapAddress(addressRow));
}

// Batch-loads items/addresses for a whole page of orders in 2 queries total
// instead of loadOrder()'s 2-per-order — list()/listByPhone() used to call
// loadOrder() once per row (an extra order re-fetch plus its own items/address
// round trips each), which made the admin dashboard and orders list do
// 1 + 3*N Supabase round trips on every load.
async function assembleOrders(orderRows: Record<string, unknown>[]): Promise<Order[]> {
  if (orderRows.length === 0) return [];
  const client = getSupabaseClient();
  const orderIds = orderRows.map((row) => row.id as string);
  const addressIds = orderRows.map((row) => row.shipping_address_id as string);

  const [{ data: itemRows, error: itemsError }, { data: addressRows, error: addressError }] = await Promise.all([
    client.from("order_items").select("*").in("order_id", orderIds),
    client.from("addresses").select("*").in("id", addressIds),
  ]);
  if (itemsError) throw itemsError;
  if (addressError) throw addressError;

  const itemsByOrderId = new Map<string, ReturnType<typeof mapOrderItem>[]>();
  for (const row of itemRows ?? []) {
    const item = mapOrderItem(row);
    const existing = itemsByOrderId.get(item.orderId);
    if (existing) existing.push(item);
    else itemsByOrderId.set(item.orderId, [item]);
  }
  const addressById = new Map((addressRows ?? []).map((row) => [row.id as string, mapAddress(row)]));

  return orderRows.map((row) =>
    mapOrder(row, itemsByOrderId.get(row.id as string) ?? [], addressById.get(row.shipping_address_id as string)!)
  );
}

export function createSupabaseOrderRepository(): OrderRepository {
  return {
    async create(input) {
      const client = getSupabaseClient();
      const variantIds = input.items.map((i) => i.variantId);

      const { data: variantRows, error: variantError } = await client
        .from("product_variants")
        .select("*, products(name)")
        .in("id", variantIds);
      if (variantError && !isInvalidUuidError(variantError)) throw variantError;
      if (!variantRows || variantRows.length !== variantIds.length) {
        throw new Error("One or more cart items are no longer available.");
      }

      // Reject the order outright if the requested quantity exceeds current
      // stock for any line — cart quantities are user-controlled (see
      // src/lib/cart.ts) and must never be trusted for fulfillment as-is.
      // Note: this only *validates* against the stock snapshot at order time;
      // it does not decrement stock afterwards, so it doesn't fully prevent
      // overselling across many concurrent orders (see README "What's next").
      const outOfStock = input.items.find((cartItem) => {
        const row = variantRows.find((v) => v.id === cartItem.variantId)!;
        return cartItem.quantity > (row.stock_qty as number);
      });
      if (outOfStock) {
        throw new Error("One or more items in your cart exceed available stock.");
      }

      const itemsData = input.items.map((cartItem) => {
        const row = variantRows.find((v) => v.id === cartItem.variantId)!;
        return {
          variant_id: row.id as string,
          product_name: (row.products as { name: string }).name,
          variant_label: row.label as string,
          quantity: cartItem.quantity,
          price_at_purchase: Number(row.price),
        };
      });
      const subtotal = itemsData.reduce((sum, i) => sum + i.price_at_purchase * i.quantity, 0);
      const discount = 0;
      const total = subtotal - discount;

      const { data: customerRow, error: customerError } = await client
        .from("customers")
        .upsert(
          { full_name: input.customer.fullName, phone: input.customer.phone, email: input.customer.email },
          { onConflict: "phone" }
        )
        .select()
        .single();
      if (customerError) throw customerError;

      const { data: addressRow, error: addressError } = await client
        .from("addresses")
        .insert({
          customer_id: customerRow.id,
          full_name: input.address.fullName,
          phone: input.address.phone,
          line1: input.address.line1,
          line2: input.address.line2,
          village: input.address.village,
          district: input.address.district,
          state: input.address.state,
          pincode: input.address.pincode,
        })
        .select()
        .single();
      if (addressError) throw addressError;

      const { data: orderRow, error: orderError } = await client
        .from("orders")
        .insert({
          customer_id: customerRow.id,
          status: "pending",
          subtotal,
          discount,
          total,
          shipping_address_id: addressRow.id,
          coupon_code: input.couponCode,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { data: itemRows, error: itemsError } = await client
        .from("order_items")
        .insert(itemsData.map((i) => ({ ...i, order_id: orderRow.id })))
        .select();
      if (itemsError) throw itemsError;

      return mapOrder(orderRow, (itemRows ?? []).map(mapOrderItem), mapAddress(addressRow));
    },

    async list() {
      const client = getSupabaseClient();
      const { data: orderRows, error } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return assembleOrders(orderRows ?? []);
    },

    async findById(id) {
      return loadOrder(id);
    },

    async listByPhone(phone) {
      const client = getSupabaseClient();
      const { data: customerRow } = await client.from("customers").select("id").eq("phone", phone).maybeSingle();
      if (!customerRow) return [];

      const { data: orderRows, error } = await client
        .from("orders")
        .select("*")
        .eq("customer_id", customerRow.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return assembleOrders(orderRows ?? []);
    },

    async updateStatus(id, status) {
      const client = getSupabaseClient();
      const { error } = await client.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      const updated = await loadOrder(id);
      if (!updated) throw new Error(`Order ${id} not found`);
      return updated;
    },
  };
}
