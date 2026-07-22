import type { Order, OrderStatus } from "@/types";

const EXCLUDED_STATUSES: OrderStatus[] = ["cancelled", "returned"];

function isRevenueCounted(order: Order): boolean {
  return !EXCLUDED_STATUSES.includes(order.status);
}

export interface RevenueTrendPoint {
  date: string;
  label: string;
  total: number;
}

/**
 * Daily revenue for the trailing `days` (default 14), oldest first, including
 * days with zero orders so the chart's x-axis has no gaps. Cancelled/returned
 * orders are excluded, matching the dashboard's existing revenue stat.
 */
export function revenueTrend(orders: Order[], days = 14, now: Date = new Date()): RevenueTrendPoint[] {
  const points: RevenueTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const date = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    points.push({ date, label, total: 0 });
  }
  const byDate = new Map(points.map((p) => [p.date, p]));

  for (const order of orders) {
    if (!isRevenueCounted(order)) continue;
    const date = order.createdAt.slice(0, 10);
    const point = byDate.get(date);
    if (point) point.total += order.total;
  }

  return points;
}

export interface TopSeller {
  productName: string;
  quantity: number;
  revenue: number;
}

/** Best-selling products by units sold across non-cancelled/returned orders. */
export function topSellers(orders: Order[], limit = 5): TopSeller[] {
  const byProduct = new Map<string, TopSeller>();
  for (const order of orders) {
    if (!isRevenueCounted(order)) continue;
    for (const item of order.items) {
      const existing = byProduct.get(item.productName);
      const revenue = item.priceAtPurchase * item.quantity;
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += revenue;
      } else {
        byProduct.set(item.productName, { productName: item.productName, quantity: item.quantity, revenue });
      }
    }
  }
  return [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

/** Order counts per status, in the pipeline's natural order, zero-filled. */
export function statusBreakdown(orders: Order[]): StatusCount[] {
  const counts = new Map<OrderStatus, number>(ALL_STATUSES.map((s) => [s, 0]));
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }
  return ALL_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}
