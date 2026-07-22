import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockCookieStore } from "../../../../vitest.setup";
import { makeOrder } from "@/test/fixtures";
import { PHONE_COOKIE } from "@/lib/orderLookup";

const listByPhone = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ orders: { listByPhone } }),
}));

import OrdersPage from "./page";

async function renderPage(searchParams: { phone?: string } = {}) {
  const jsx = await OrdersPage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

describe("OrdersPage", () => {
  beforeEach(() => {
    listByPhone.mockReset();
    mockCookieStore.delete(PHONE_COOKIE);
  });

  it("shows the lookup prompt without querying when no phone is known", async () => {
    await renderPage();
    expect(screen.getByText(/enter the phone number you used at checkout/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find orders" })).toBeInTheDocument();
    expect(listByPhone).not.toHaveBeenCalled();
  });

  it("lists orders for a valid ?phone= param with status, total and a detail link", async () => {
    listByPhone.mockResolvedValue([makeOrder(), makeOrder({ id: "ORD-2", status: "shipped" })]);
    await renderPage({ phone: "9876543210" });

    expect(listByPhone).toHaveBeenCalledWith("9876543210");
    expect(screen.getByText(/showing orders placed with 9876543210/i)).toBeInTheDocument();
    expect(screen.getByText("#ORD-1")).toBeInTheDocument();
    expect(screen.getByText("shipped")).toBeInTheDocument();
    const card = screen.getByText("#ORD-2").closest("a");
    expect(card).toHaveAttribute("href", "/orders/ORD-2");
  });

  it("falls back to the phone remembered from checkout when there is no query param", async () => {
    mockCookieStore.set(PHONE_COOKIE, "9123456789");
    listByPhone.mockResolvedValue([makeOrder()]);
    await renderPage();

    expect(listByPhone).toHaveBeenCalledWith("9123456789");
    expect(screen.getByText(/showing orders placed with 9123456789/i)).toBeInTheDocument();
  });

  it("prefers a valid query param over the remembered cookie", async () => {
    mockCookieStore.set(PHONE_COOKIE, "9123456789");
    listByPhone.mockResolvedValue([]);
    await renderPage({ phone: "9876543210" });
    expect(listByPhone).toHaveBeenCalledWith("9876543210");
  });

  it("shows a validation error for an invalid ?phone= and does not query with it", async () => {
    await renderPage({ phone: "12345" });
    expect(screen.getByText(/valid 10-digit phone number/i)).toBeInTheDocument();
    expect(listByPhone).not.toHaveBeenCalled();
  });

  it("still shows the remembered phone's orders when the query param is invalid", async () => {
    mockCookieStore.set(PHONE_COOKIE, "9123456789");
    listByPhone.mockResolvedValue([makeOrder()]);
    await renderPage({ phone: "junk" });
    expect(listByPhone).toHaveBeenCalledWith("9123456789");
    expect(screen.getByText(/valid 10-digit phone number/i)).toBeInTheDocument();
  });

  it("shows an empty state when the phone has no orders", async () => {
    listByPhone.mockResolvedValue([]);
    await renderPage({ phone: "9876543210" });
    expect(screen.getByText(/no orders found for 9876543210/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue browsing" })).toHaveAttribute("href", "/shop");
  });

  it("sums line-item quantities into the item count", async () => {
    listByPhone.mockResolvedValue([makeOrder()]);
    await renderPage({ phone: "9876543210" });
    // makeOrder has a single line item with quantity 2
    expect(screen.getByText(/2 items/)).toBeInTheDocument();
  });

  it("uses the singular label for a single-quantity order", async () => {
    const order = makeOrder();
    order.items = [{ ...order.items[0], quantity: 1 }];
    listByPhone.mockResolvedValue([order]);
    await renderPage({ phone: "9876543210" });
    expect(screen.getByText(/1 item(?!s)/)).toBeInTheDocument();
  });
});
