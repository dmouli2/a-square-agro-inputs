import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeOrder, makeProduct } from "@/test/fixtures";

const listAllProducts = vi.fn();
const listOrders = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    products: { listAll: listAllProducts },
    orders: { list: listOrders },
  }),
}));

import AdminDashboardPage from "./page";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    listAllProducts.mockReset();
    listOrders.mockReset();
  });

  it("renders stat cards, revenue and empty states for orders, top sellers and status breakdown", async () => {
    listAllProducts.mockResolvedValue([]);
    listOrders.mockResolvedValue([]);

    const jsx = await AdminDashboardPage();
    render(jsx);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
    expect(screen.getByText("Total revenue (all orders)")).toBeInTheDocument();
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
    expect(screen.getByText("No status data yet.")).toBeInTheDocument();
  });

  it("computes pending count, low-stock count and revenue excluding cancelled/returned orders", async () => {
    listAllProducts.mockResolvedValue([
      makeProduct({
        variants: [
          { id: "v1", productId: "prod-1", sku: "SKU-1", label: "1 kg", packSize: 1, unit: "kg", price: 10, mrp: 12, stockQty: 3 },
          { id: "v2", productId: "prod-1", sku: "SKU-2", label: "5 kg", packSize: 5, unit: "kg", price: 40, mrp: 45, stockQty: 0 },
        ],
      }),
    ]);
    listOrders.mockResolvedValue([
      makeOrder({ id: "ORD-1", status: "pending", total: 1000 }),
      makeOrder({ id: "ORD-2", status: "confirmed", total: 500 }),
      makeOrder({ id: "ORD-3", status: "cancelled", total: 2000 }),
      makeOrder({ id: "ORD-4", status: "delivered", total: 300 }),
    ]);

    const jsx = await AdminDashboardPage();
    render(jsx);

    // pending + confirmed = 2 orders "needing attention"
    expect(screen.getByText("Needs attention").nextSibling).toHaveTextContent("2");
    // revenue excludes the cancelled order: 1000 + 500 + 300 = 1800
    expect(screen.getByText("₹1,800")).toBeInTheDocument();
    expect(screen.getByText("#ORD-1")).toBeInTheDocument();
    expect(screen.getAllByText("Ramesh Kumar").length).toBe(4);
  });

  it("only lists the 5 most recent orders", async () => {
    listAllProducts.mockResolvedValue([]);
    listOrders.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => makeOrder({ id: `ORD-${i}` }))
    );

    const jsx = await AdminDashboardPage();
    render(jsx);

    expect(screen.getByText("#ORD-0")).toBeInTheDocument();
    expect(screen.getByText("#ORD-4")).toBeInTheDocument();
    expect(screen.queryByText("#ORD-5")).not.toBeInTheDocument();
  });

  it("shows top sellers ranked by quantity and a non-zero status breakdown", async () => {
    listAllProducts.mockResolvedValue([]);
    listOrders.mockResolvedValue([
      makeOrder({
        id: "ORD-1",
        status: "pending",
        items: [{ id: "i1", orderId: "ORD-1", variantId: "v1", productName: "Urea", variantLabel: "50 kg", quantity: 10, priceAtPurchase: 100 }],
      }),
      makeOrder({
        id: "ORD-2",
        status: "delivered",
        items: [{ id: "i2", orderId: "ORD-2", variantId: "v2", productName: "Maize Seed", variantLabel: "1 kg", quantity: 2, priceAtPurchase: 500 }],
      }),
    ]);

    const jsx = await AdminDashboardPage();
    render(jsx);

    expect(screen.getByText("Urea")).toBeInTheDocument();
    expect(screen.getByText("10 sold")).toBeInTheDocument();
    expect(screen.getByText("Maize Seed")).toBeInTheDocument();
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("delivered").length).toBeGreaterThan(0);
  });

  it("renders a non-zero revenue trend bar for an order placed today", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T12:00:00.000Z"));
    listAllProducts.mockResolvedValue([]);
    listOrders.mockResolvedValue([makeOrder({ createdAt: "2026-07-22T08:00:00.000Z", total: 1500 })]);

    const jsx = await AdminDashboardPage();
    render(jsx);
    vi.useRealTimers();

    expect(screen.getByTitle(/₹1,500/)).toBeInTheDocument();
  });
});
