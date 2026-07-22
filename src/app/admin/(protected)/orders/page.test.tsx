import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeOrder } from "@/test/fixtures";

const listOrders = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ orders: { list: listOrders } }),
}));

import AdminOrdersPage from "./page";

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    listOrders.mockReset();
  });

  it("renders an empty-state message when there are no orders", async () => {
    listOrders.mockResolvedValue([]);

    const jsx = await AdminOrdersPage();
    render(jsx);

    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it("renders a row per order with status badge and formatted total/date", async () => {
    listOrders.mockResolvedValue([
      makeOrder({ id: "ORD-1", status: "pending", total: 1200 }),
      makeOrder({ id: "ORD-2", status: "delivered", total: 800 }),
    ]);

    const jsx = await AdminOrdersPage();
    render(jsx);

    expect(screen.getByText("#ORD-1")).toBeInTheDocument();
    expect(screen.getByText("#ORD-2")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("delivered")).toBeInTheDocument();
    expect(screen.getByText("₹1,200")).toBeInTheDocument();
  });
});
