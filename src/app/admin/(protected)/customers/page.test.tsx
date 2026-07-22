import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CustomerSummary } from "@/types";

const list = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ customers: { list } }),
}));

import AdminCustomersPage from "./page";

const customer: CustomerSummary = {
  id: "cust-1",
  fullName: "Ravi Kumar",
  phone: "9876543210",
  email: "ravi@example.com",
  orderCount: 3,
  totalSpent: 4500,
  lastOrderAt: "2026-07-15T00:00:00.000Z",
};

describe("AdminCustomersPage", () => {
  beforeEach(() => {
    list.mockReset();
  });

  it("renders an empty-state message when there are no customers", async () => {
    list.mockResolvedValue([]);
    const jsx = await AdminCustomersPage();
    render(jsx);
    expect(screen.getByText("No customers yet — they appear here after their first order.")).toBeInTheDocument();
  });

  it("renders a row per customer with phone, order count, total spent and last order date", async () => {
    list.mockResolvedValue([customer]);
    const jsx = await AdminCustomersPage();
    render(jsx);

    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
    expect(screen.getByText("ravi@example.com")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("₹4,500")).toBeInTheDocument();
    expect(screen.getByText("15 Jul 2026")).toBeInTheDocument();
  });

  it("shows an em dash for a customer with no orders yet (no lastOrderAt)", async () => {
    list.mockResolvedValue([{ ...customer, email: undefined, orderCount: 0, totalSpent: 0, lastOrderAt: null }]);
    const jsx = await AdminCustomersPage();
    render(jsx);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("ravi@example.com")).not.toBeInTheDocument();
  });
});
