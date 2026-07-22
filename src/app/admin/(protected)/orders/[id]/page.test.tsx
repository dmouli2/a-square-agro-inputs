import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeOrder } from "@/test/fixtures";

const findById = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ orders: { findById } }),
}));

vi.mock("@/app/actions/adminOrders", () => ({
  updateOrderStatus: vi.fn(),
}));

import AdminOrderDetailPage from "./page";

describe("AdminOrderDetailPage", () => {
  beforeEach(() => {
    findById.mockReset();
  });

  it("calls notFound() when the order id does not resolve", async () => {
    findById.mockResolvedValue(null);

    await expect(
      AdminOrderDetailPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders order items, status selector and totals when the order exists", async () => {
    findById.mockResolvedValue(makeOrder());

    const jsx = await AdminOrderDetailPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.getByText("Order #ORD-1")).toBeInTheDocument();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("pending");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByText("Delivering to")).toBeInTheDocument();
  });

  it("links 'Notify customer' to the customer's WhatsApp with a status message prefilled", async () => {
    findById.mockResolvedValue(makeOrder({ status: "shipped" }));

    const jsx = await AdminOrderDetailPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    const link = screen.getByRole("link", { name: "Notify customer" });
    const href = link.getAttribute("href")!;
    expect(href).toContain("https://wa.me/919876543210?text=");
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain("#ORD-1");
    expect(decoded).toContain("shipped");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders the optional address line2/village fields when present", async () => {
    findById.mockResolvedValue(
      makeOrder({
        shippingAddress: {
          id: "addr-2",
          customerId: "cust-1",
          fullName: "Suresh",
          phone: "9999999999",
          line1: "45 Canal Road",
          line2: "Near temple",
          village: "Palem",
          district: "Krishna",
          state: "Andhra Pradesh",
          pincode: "521001",
        },
      })
    );

    const jsx = await AdminOrderDetailPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.getByText("Near temple", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Palem", { exact: false })).toBeInTheDocument();
  });

  it("omits line2/village from the address block when neither is set", async () => {
    findById.mockResolvedValue(
      makeOrder({
        shippingAddress: {
          id: "addr-3",
          customerId: "cust-1",
          fullName: "Suresh",
          phone: "9999999999",
          line1: "45 Canal Road",
          district: "Krishna",
          state: "Andhra Pradesh",
          pincode: "521001",
        },
      })
    );

    const jsx = await AdminOrderDetailPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.getByText("45 Canal Road", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Near temple", { exact: false })).not.toBeInTheDocument();
  });
});
