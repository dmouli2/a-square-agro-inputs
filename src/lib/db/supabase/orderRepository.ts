import { getSupabaseClient } from "@/lib/supabase/client";
import type { OrderRepository } from "@/lib/db/types";
import { mapAddress, mapOrder, mapOrderItem } from "./mappers";

async function loadOrder(orderId: string) {
  const client = getSupabaseClient();
  const { data: orderRow, error } = await client.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!orderRow) return null;

  const [{ data: itemRows, error: itemsError }, { data: addressRow, error: addressError }] = await Promise.all([
    client.from("order_items").select("*").eq("order_id", orderId),
    client.from("addresses").select("*").eq("id", orderRow.shipping_address_id).single(),
  ]);
  if (itemsError) throw itemsError;
  if (addressError) throw addressError;

  return mapOrder(orderRow, (itemRows ?? []).map(mapOrderItem), mapAddress(addressRow));
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
      if (variantError) throw variantError;
      if (!variantRows || variantRows.length !== variantIds.length) {
        throw new Error("One or more cart items are no longer available.");
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
        .select("id")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orders = await Promise.all((orderRows ?? []).map((row) => loadOrder(row.id as string)));
      return orders.filter((o) => o !== null);
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
        .select("id")
        .eq("customer_id", customerRow.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orders = await Promise.all((orderRows ?? []).map((row) => loadOrder(row.id as string)));
      return orders.filter((o) => o !== null);
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
