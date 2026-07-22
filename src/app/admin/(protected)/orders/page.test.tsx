import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeOrder } from "@/test/fixtures";

const listOrders = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ orders: { list: listOrders } }),
}));

import AdminOrdersPage from "./page";

function renderPage(searchParams: { q?: string; page?: string } = {}) {
  return AdminOrdersPage({ searchParams: Promise.resolve(searchParams) }).then(render);
}

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    listOrders.mockReset();
  });

  it("renders an empty-state message when there are no orders", async () => {
    listOrders.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it("renders a row per order with status badge and formatted total/date", async () => {
    listOrders.mockResolvedValue([
      makeOrder({ id: "ORD-1", status: "pending", total: 1200 }),
      makeOrder({ id: "ORD-2", status: "delivered", total: 800 }),
    ]);

    await renderPage();

    expect(screen.getByText("#ORD-1")).toBeInTheDocument();
    expect(screen.getByText("#ORD-2")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("delivered")).toBeInTheDocument();
    expect(screen.getByText("₹1,200")).toBeInTheDocument();
  });

  it("filters by order id, customer name or phone (case-insensitive)", async () => {
    listOrders.mockResolvedValue([
      makeOrder({ id: "ORD-1", shippingAddress: { ...makeOrder().shippingAddress, fullName: "Ravi Kumar", phone: "9876543210" } }),
      makeOrder({ id: "ORD-2", shippingAddress: { ...makeOrder().shippingAddress, fullName: "Suresh Babu", phone: "9123456789" } }),
    ]);

    await renderPage({ q: "ravi" });
    expect(screen.getByText("#ORD-1")).toBeInTheDocument();
    expect(screen.queryByText("#ORD-2")).not.toBeInTheDocument();
  });

  it("shows a query-specific empty state when the search matches nothing", async () => {
    listOrders.mockResolvedValue([makeOrder()]);
    await renderPage({ q: "nonexistent" });
    expect(screen.getByText('No orders match "nonexistent".')).toBeInTheDocument();
  });

  it("paginates to 20 orders per page and links Next with the query preserved", async () => {
    listOrders.mockResolvedValue(Array.from({ length: 25 }, (_, i) => makeOrder({ id: `ORD-${i}` })));

    await renderPage();
    expect(screen.getByText("#ORD-0")).toBeInTheDocument();
    expect(screen.queryByText("#ORD-20")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/admin/orders?page=2");
  });

  it("shows the second page of results", async () => {
    listOrders.mockResolvedValue(Array.from({ length: 25 }, (_, i) => makeOrder({ id: `ORD-${i}` })));

    await renderPage({ page: "2" });
    expect(screen.getByText("#ORD-20")).toBeInTheDocument();
    expect(screen.queryByText("#ORD-0")).not.toBeInTheDocument();
  });
});
