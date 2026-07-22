import { describe, it, expect } from "vitest";
import { makeOrder } from "@/test/fixtures";
import { revenueTrend, topSellers, statusBreakdown } from "./analytics";

const NOW = new Date("2026-07-22T12:00:00.000Z");

describe("revenueTrend", () => {
  it("returns one zero-filled point per day for the trailing window, oldest first", () => {
    const points = revenueTrend([], 5, NOW);
    expect(points).toHaveLength(5);
    expect(points.every((p) => p.total === 0)).toBe(true);
    expect(points[0].date).toBe("2026-07-18");
    expect(points[4].date).toBe("2026-07-22");
  });

  it("sums same-day order totals onto the matching point", () => {
    const orders = [
      makeOrder({ createdAt: "2026-07-20T09:00:00.000Z", total: 500 }),
      makeOrder({ createdAt: "2026-07-20T15:00:00.000Z", total: 300 }),
      makeOrder({ createdAt: "2026-07-22T08:00:00.000Z", total: 1000 }),
    ];
    const points = revenueTrend(orders, 5, NOW);
    expect(points.find((p) => p.date === "2026-07-20")?.total).toBe(800);
    expect(points.find((p) => p.date === "2026-07-22")?.total).toBe(1000);
  });

  it("excludes cancelled and returned orders from the daily total", () => {
    const orders = [
      makeOrder({ createdAt: "2026-07-22T08:00:00.000Z", total: 500, status: "cancelled" }),
      makeOrder({ createdAt: "2026-07-22T09:00:00.000Z", total: 300, status: "returned" }),
    ];
    const points = revenueTrend(orders, 5, NOW);
    expect(points.find((p) => p.date === "2026-07-22")?.total).toBe(0);
  });

  it("ignores an order that falls outside the trailing window", () => {
    const orders = [makeOrder({ createdAt: "2026-01-01T00:00:00.000Z", total: 999 })];
    const points = revenueTrend(orders, 5, NOW);
    expect(points.reduce((sum, p) => sum + p.total, 0)).toBe(0);
  });

  it("defaults to a 14-day window", () => {
    expect(revenueTrend([], undefined, NOW)).toHaveLength(14);
  });
});

describe("topSellers", () => {
  it("aggregates quantity and revenue per product name across orders", () => {
    const orders = [
      makeOrder({
        items: [
          { id: "i1", orderId: "ORD-1", variantId: "v1", productName: "Maize Seed", variantLabel: "1 kg", quantity: 2, priceAtPurchase: 500 },
        ],
      }),
      makeOrder({
        id: "ORD-2",
        items: [
          { id: "i2", orderId: "ORD-2", variantId: "v1", productName: "Maize Seed", variantLabel: "1 kg", quantity: 3, priceAtPurchase: 500 },
          { id: "i3", orderId: "ORD-2", variantId: "v2", productName: "Urea", variantLabel: "50 kg", quantity: 1, priceAtPurchase: 1200 },
        ],
      }),
    ];
    const result = topSellers(orders);
    expect(result[0]).toEqual({ productName: "Maize Seed", quantity: 5, revenue: 2500 });
    expect(result[1]).toEqual({ productName: "Urea", quantity: 1, revenue: 1200 });
  });

  it("excludes cancelled/returned orders from the ranking", () => {
    const orders = [makeOrder({ status: "cancelled" })];
    expect(topSellers(orders)).toEqual([]);
  });

  it("respects the limit and returns highest quantity first", () => {
    const orders = ["A", "B", "C"].map((name, i) =>
      makeOrder({
        id: `ORD-${i}`,
        items: [{ id: `i${i}`, orderId: `ORD-${i}`, variantId: "v1", productName: name, variantLabel: "1 kg", quantity: i + 1, priceAtPurchase: 100 }],
      })
    );
    expect(topSellers(orders, 2).map((s) => s.productName)).toEqual(["C", "B"]);
  });
});

describe("statusBreakdown", () => {
  it("zero-fills every pipeline status and counts matching orders", () => {
    const orders = [makeOrder({ status: "pending" }), makeOrder({ id: "ORD-2", status: "pending" }), makeOrder({ id: "ORD-3", status: "delivered" })];
    const result = statusBreakdown(orders);
    expect(result).toEqual([
      { status: "pending", count: 2 },
      { status: "confirmed", count: 0 },
      { status: "packed", count: 0 },
      { status: "shipped", count: 0 },
      { status: "delivered", count: 1 },
      { status: "cancelled", count: 0 },
      { status: "returned", count: 0 },
    ]);
  });

  it("returns all-zero counts for no orders", () => {
    expect(statusBreakdown([]).every((s) => s.count === 0)).toBe(true);
  });
});
