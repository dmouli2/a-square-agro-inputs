import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseOrderRepository } from "./orderRepository";
import type { CreateOrderInput } from "@/types";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/client")>();
  return { ...actual, getSupabaseClient: vi.fn() };
});

type QueryResult = { data: unknown; error: { message: string; code?: string } | null };

function fakeQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const orderRow = {
  id: "o1",
  customer_id: "cu1",
  status: "pending",
  subtotal: 820,
  discount: 0,
  total: 820,
  shipping_address_id: "a1",
  coupon_code: null,
  created_at: "2026-07-01T00:00:00.000Z",
};
const addressRow = { id: "a1", customer_id: "cu1", full_name: "Ravi", phone: "9876543210", line1: "L1", district: "D", state: "S", pincode: "P" };
const itemRow = { id: "i1", order_id: "o1", variant_id: "v1", product_name: "Taqat", variant_label: "500 ml", quantity: 1, price_at_purchase: 820 };

const orderInput: CreateOrderInput = {
  customer: { fullName: "Ravi", phone: "9876543210" },
  address: { fullName: "Ravi", phone: "9876543210", line1: "L1", district: "D", state: "S", pincode: "P" },
  items: [{ variantId: "v1", quantity: 1 }],
};

describe("createSupabaseOrderRepository", () => {
  const from = vi.fn();

  beforeEach(() => {
    from.mockReset();
  });

  function mockTablesForSuccessfulCreate(overrides?: { variantRow?: Record<string, unknown> }) {
    const variantRow = overrides?.variantRow ?? {
      id: "v1",
      price: 820,
      label: "500 ml",
      stock_qty: 18,
      products: { name: "Taqat" },
    };
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return fakeQuery({ data: [variantRow], error: null });
      if (table === "customers") return fakeQuery({ data: { id: "cu1" }, error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      if (table === "orders") return fakeQuery({ data: orderRow, error: null });
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  }

  it("creates an order, pulling price from the live variant row (not the client input)", async () => {
    mockTablesForSuccessfulCreate();
    const repo = createSupabaseOrderRepository();
    const result = await repo.create(orderInput);
    expect(result.total).toBe(820);
    expect(result.items[0].priceAtPurchase).toBe(820);
  });

  it("rejects the order when a cart item references a variant that no longer exists", async () => {
    from.mockImplementation((table: string) => (table === "product_variants" ? fakeQuery({ data: [], error: null }) : fakeQuery({ data: null, error: null })));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("One or more cart items are no longer available.");
  });

  it("treats an invalid-uuid variant lookup error the same as no rows found", async () => {
    from.mockImplementation((table: string) =>
      table === "product_variants" ? fakeQuery({ data: null, error: { message: "invalid", code: "22P02" } }) : fakeQuery({ data: null, error: null })
    );
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("One or more cart items are no longer available.");
  });

  it("rejects the order when the requested quantity exceeds current stock", async () => {
    mockTablesForSuccessfulCreate({ variantRow: { id: "v1", price: 820, label: "500 ml", stock_qty: 0, products: { name: "Taqat" } } });
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("One or more items in your cart exceed available stock.");
  });

  it("allows an order exactly at the stock boundary", async () => {
    mockTablesForSuccessfulCreate({ variantRow: { id: "v1", price: 820, label: "500 ml", stock_qty: 1, products: { name: "Taqat" } } });
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).resolves.toMatchObject({ id: "o1" });
  });

  it("throws when the customer upsert fails", async () => {
    from.mockImplementation((table: string) =>
      table === "product_variants"
        ? fakeQuery({ data: [{ id: "v1", price: 820, label: "500 ml", stock_qty: 18, products: { name: "Taqat" } }], error: null })
        : table === "customers"
          ? fakeQuery({ data: null, error: { message: "customer failed" } })
          : fakeQuery({ data: null, error: null })
    );
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("customer failed");
  });

  it("throws when the address insert fails", async () => {
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return fakeQuery({ data: [{ id: "v1", price: 820, label: "500 ml", stock_qty: 18, products: { name: "Taqat" } }], error: null });
      if (table === "customers") return fakeQuery({ data: { id: "cu1" }, error: null });
      if (table === "addresses") return fakeQuery({ data: null, error: { message: "address failed" } });
      return fakeQuery({ data: null, error: null });
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("address failed");
  });

  it("throws when the order insert fails", async () => {
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return fakeQuery({ data: [{ id: "v1", price: 820, label: "500 ml", stock_qty: 18, products: { name: "Taqat" } }], error: null });
      if (table === "customers") return fakeQuery({ data: { id: "cu1" }, error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      if (table === "orders") return fakeQuery({ data: null, error: { message: "order failed" } });
      return fakeQuery({ data: null, error: null });
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("order failed");
  });

  it("throws when the order_items insert fails", async () => {
    from.mockImplementation((table: string) => {
      if (table === "product_variants") return fakeQuery({ data: [{ id: "v1", price: 820, label: "500 ml", stock_qty: 18, products: { name: "Taqat" } }], error: null });
      if (table === "customers") return fakeQuery({ data: { id: "cu1" }, error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      if (table === "orders") return fakeQuery({ data: orderRow, error: null });
      if (table === "order_items") return fakeQuery({ data: null, error: { message: "items failed" } });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.create(orderInput)).rejects.toThrow("items failed");
  });

  it("list returns every order newest-first, loading items and address for each", async () => {
    from.mockImplementation((table: string) => {
      if (table === "orders") return fakeQuery({ data: [{ id: "o1" }], error: null });
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    // loadOrder needs the order row itself too
    const ordersQuery = fakeQuery({ data: [{ id: "o1" }], error: null });
    let listCall = 0;
    from.mockImplementation((table: string) => {
      if (table === "orders") {
        listCall += 1;
        return listCall === 1 ? ordersQuery : fakeQuery({ data: orderRow, error: null });
      }
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    const repo = createSupabaseOrderRepository();
    const result = await repo.list();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("o1");
  });

  it("list throws when the orders query itself errors", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "list failed" } }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.list()).rejects.toThrow("list failed");
  });

  it("findById returns null when the order row doesn't exist", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    expect(await repo.findById("missing")).toBeNull();
  });

  it("findById returns null for an invalid uuid instead of throwing", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "invalid", code: "22P02" } }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    expect(await repo.findById("not-a-uuid")).toBeNull();
  });

  it("findById throws on a real order lookup error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom", code: "500" } }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.findById("o1")).rejects.toThrow("boom");
  });

  it("findById throws when the order_items lookup errors", async () => {
    from.mockImplementation((table: string) => {
      if (table === "orders") return fakeQuery({ data: orderRow, error: null });
      if (table === "order_items") return fakeQuery({ data: null, error: { message: "items failed" } });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.findById("o1")).rejects.toThrow("items failed");
  });

  it("findById throws when the shipping address lookup errors", async () => {
    from.mockImplementation((table: string) => {
      if (table === "orders") return fakeQuery({ data: orderRow, error: null });
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      if (table === "addresses") return fakeQuery({ data: null, error: { message: "address failed" } });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.findById("o1")).rejects.toThrow("address failed");
  });

  it("listByPhone returns an empty array when no customer matches the phone", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    expect(await repo.listByPhone("9999999999")).toEqual([]);
  });

  it("listByPhone returns the matching customer's orders", async () => {
    let customersCall = false;
    let ordersCall = 0;
    from.mockImplementation((table: string) => {
      if (table === "customers") {
        customersCall = true;
        return fakeQuery({ data: { id: "cu1" }, error: null });
      }
      if (table === "orders") {
        ordersCall += 1;
        return ordersCall === 1 ? fakeQuery({ data: [{ id: "o1" }], error: null }) : fakeQuery({ data: orderRow, error: null });
      }
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    const result = await repo.listByPhone("9876543210");
    expect(customersCall).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("listByPhone throws when the orders lookup errors", async () => {
    from.mockImplementation((table: string) => {
      if (table === "customers") return fakeQuery({ data: { id: "cu1" }, error: null });
      if (table === "orders") return fakeQuery({ data: null, error: { message: "boom" } });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.listByPhone("9876543210")).rejects.toThrow("boom");
  });

  it("updateStatus updates the row and returns the reloaded order", async () => {
    from.mockImplementation((table: string) => {
      if (table === "orders") return fakeQuery({ data: orderRow, error: null });
      if (table === "order_items") return fakeQuery({ data: [itemRow], error: null });
      if (table === "addresses") return fakeQuery({ data: addressRow, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    const result = await repo.updateStatus("o1", "confirmed");
    expect(result.id).toBe("o1");
  });

  it("updateStatus throws when the update itself errors", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "update failed" } }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.updateStatus("o1", "confirmed")).rejects.toThrow("update failed");
  });

  it("updateStatus throws if the order can't be reloaded after updating", async () => {
    from.mockImplementation((table: string) => (table === "orders" ? fakeQuery({ data: null, error: null }) : fakeQuery({ data: null, error: null })));
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
    const repo = createSupabaseOrderRepository();
    await expect(repo.updateStatus("o1", "confirmed")).rejects.toThrow("Order o1 not found");
  });
});
