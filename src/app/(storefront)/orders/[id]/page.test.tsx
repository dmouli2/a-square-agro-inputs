import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeOrder } from "@/test/fixtures";

const findById = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ orders: { findById } }),
}));

import OrderConfirmationPage from "./page";

describe("OrderConfirmationPage", () => {
  beforeEach(() => {
    findById.mockReset();
  });

  it("renders order items, totals and delivery address when the order exists", async () => {
    findById.mockResolvedValue(makeOrder());

    const jsx = await OrderConfirmationPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.getByText("Order placed!")).toBeInTheDocument();
    expect(screen.getByText("#ORD-1", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Hybrid Maize Seed")).toBeInTheDocument();
    expect(screen.getByText("Delivering to")).toBeInTheDocument();
    expect(screen.getByText("Ramesh Kumar, 9876543210", { exact: false })).toBeInTheDocument();
  });

  it("calls notFound() when the order id does not resolve", async () => {
    findById.mockResolvedValue(null);

    await expect(
      OrderConfirmationPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("does not ask the customer to relay their own order to the store over WhatsApp", async () => {
    findById.mockResolvedValue(makeOrder());

    const jsx = await OrderConfirmationPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.queryByRole("link", { name: "Send order on WhatsApp" })).not.toBeInTheDocument();
  });

  it("renders an optional address line2/village when present", async () => {
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

    const jsx = await OrderConfirmationPage({ params: Promise.resolve({ id: "ORD-1" }) });
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

    const jsx = await OrderConfirmationPage({ params: Promise.resolve({ id: "ORD-1" }) });
    render(jsx);

    expect(screen.getByText("45 Canal Road", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Near temple", { exact: false })).not.toBeInTheDocument();
  });
});
