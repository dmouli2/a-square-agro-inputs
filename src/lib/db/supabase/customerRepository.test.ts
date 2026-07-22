import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseCustomerRepository } from "./customerRepository";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

function fakeQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: (r: QueryResult) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe("createSupabaseCustomerRepository", () => {
  const from = vi.fn();

  beforeEach(() => {
    from.mockReset();
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);
  });

  it("aggregates order count, spend (excluding cancelled/returned) and the latest order date", async () => {
    from.mockReturnValue(
      fakeQuery({
        data: [
          {
            id: "cust-1",
            full_name: "Ravi Kumar",
            phone: "9876543210",
            email: null,
            orders: [
              { total: "500.00", status: "delivered", created_at: "2026-07-01T00:00:00.000Z" },
              { total: "300.00", status: "cancelled", created_at: "2026-07-10T00:00:00.000Z" },
              { total: "200.00", status: "pending", created_at: "2026-07-15T00:00:00.000Z" },
            ],
          },
        ],
        error: null,
      })
    );

    const repo = createSupabaseCustomerRepository();
    const result = await repo.list();

    expect(result).toEqual([
      {
        id: "cust-1",
        fullName: "Ravi Kumar",
        phone: "9876543210",
        email: undefined,
        orderCount: 3,
        totalSpent: 700,
        lastOrderAt: "2026-07-15T00:00:00.000Z",
      },
    ]);
  });

  it("keeps the running-latest date when a later order is encountered before an earlier one", async () => {
    from.mockReturnValue(
      fakeQuery({
        data: [
          {
            id: "cust-3",
            full_name: "Lakshmi",
            phone: "9988776655",
            email: null,
            orders: [
              { total: "100.00", status: "pending", created_at: "2026-07-15T00:00:00.000Z" },
              { total: "100.00", status: "pending", created_at: "2026-07-01T00:00:00.000Z" },
            ],
          },
        ],
        error: null,
      })
    );

    const repo = createSupabaseCustomerRepository();
    const [customer] = await repo.list();
    expect(customer.lastOrderAt).toBe("2026-07-15T00:00:00.000Z");
  });

  it("defaults a missing orders relation on the row to an empty array", async () => {
    from.mockReturnValue(
      fakeQuery({
        data: [{ id: "cust-4", full_name: "No Orders", phone: "9000000000", email: null, orders: undefined }],
        error: null,
      })
    );

    const repo = createSupabaseCustomerRepository();
    const [customer] = await repo.list();
    expect(customer.orderCount).toBe(0);
    expect(customer.lastOrderAt).toBeNull();
  });

  it("returns null lastOrderAt and zeroed aggregates for a customer with no orders", async () => {
    from.mockReturnValue(
      fakeQuery({
        data: [{ id: "cust-2", full_name: "Suresh", phone: "9123456789", email: "s@example.com", orders: [] }],
        error: null,
      })
    );

    const repo = createSupabaseCustomerRepository();
    const [customer] = await repo.list();
    expect(customer.orderCount).toBe(0);
    expect(customer.totalSpent).toBe(0);
    expect(customer.lastOrderAt).toBeNull();
    expect(customer.email).toBe("s@example.com");
  });

  it("defaults to an empty array when data is null", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: null }));
    const repo = createSupabaseCustomerRepository();
    expect(await repo.list()).toEqual([]);
  });

  it("throws on db error", async () => {
    from.mockReturnValue(fakeQuery({ data: null, error: { message: "boom" } }));
    const repo = createSupabaseCustomerRepository();
    await expect(repo.list()).rejects.toThrow("boom");
  });
});
