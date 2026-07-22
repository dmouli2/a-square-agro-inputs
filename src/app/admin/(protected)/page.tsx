import Link from "next/link";
import { getDb } from "@/lib/db";
import { revenueTrend, topSellers, statusBreakdown } from "@/lib/analytics";

const inr = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  packed: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-primary-600",
  cancelled: "bg-red-500",
  returned: "bg-red-500",
};

function RevenueTrendChart({ points }: { points: ReturnType<typeof revenueTrend> }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display font-semibold text-sm text-foreground mb-4">Revenue — last {points.length} days</h2>
      <div className="flex items-end gap-1 h-32">
        {points.map((point) => (
          <div key={point.date} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              title={`${point.label}: ${inr(point.total)}`}
              className="w-full rounded-t-sm bg-primary-500"
              style={{ height: `${(point.total / max) * 100}%`, minHeight: point.total > 0 ? "2px" : "0" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <caption>Daily revenue, last {points.length} days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{point.label}</td>
              <td>{inr(point.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopSellersCard({ sellers }: { sellers: ReturnType<typeof topSellers> }) {
  const max = Math.max(1, ...sellers.map((s) => s.quantity));
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display font-semibold text-sm text-foreground mb-4">Top sellers (by units)</h2>
      {sellers.length === 0 ? (
        <p className="text-sm text-muted">No sales yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sellers.map((seller) => (
            <div key={seller.productName}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground truncate">{seller.productName}</span>
                <span className="text-muted shrink-0 ml-2">{seller.quantity} sold</span>
              </div>
              <div className="h-2 rounded-full bg-primary-50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${(seller.quantity / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBreakdownCard({ counts }: { counts: ReturnType<typeof statusBreakdown> }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display font-semibold text-sm text-foreground mb-4">Orders by status</h2>
      {total === 0 ? (
        <p className="text-sm text-muted">No status data yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {counts
            .filter((c) => c.count > 0)
            .map((c) => (
              <div key={c.status} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_DOT[c.status]}`} aria-hidden="true" />
                <span className="capitalize text-foreground">{c.status}</span>
                <span className="text-muted ml-auto">{c.count}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const db = getDb();
  const [products, orders] = await Promise.all([db.products.listAll(), db.orders.list()]);

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const lowStockVariants = products.flatMap((p) => p.variants).filter((v) => v.stockQty > 0 && v.stockQty <= 5).length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Products", value: products.length, href: "/admin/products" },
    { label: "Orders", value: orders.length, href: "/admin/orders" },
    { label: "Needs attention", value: pendingOrders, href: "/admin/orders" },
    { label: "Low stock (≤5)", value: lowStockVariants, href: "/admin/products" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-card border border-border bg-surface p-4 hover:border-primary-300 transition-colors"
          >
            <span className="text-xs font-medium text-muted uppercase tracking-wide">{stat.label}</span>
            <p className="font-display font-bold text-2xl text-foreground mt-1">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Total revenue (all orders)</span>
        <p className="font-display font-bold text-2xl text-foreground mt-1">{inr(revenue)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RevenueTrendChart points={revenueTrend(orders)} />
        <TopSellersCard sellers={topSellers(orders)} />
      </div>

      <StatusBreakdownCard counts={statusBreakdown(orders)} />

      <div className="rounded-card border border-border bg-surface p-4">
        <h2 className="font-display font-semibold text-sm text-foreground mb-3">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between py-2.5 text-sm hover:bg-primary-50/50 -mx-2 px-2 rounded-control"
              >
                <span className="font-medium text-foreground">#{order.id}</span>
                <span className="text-muted">{order.shippingAddress.fullName}</span>
                <span className="capitalize text-primary-700">{order.status}</span>
                <span className="font-medium text-foreground">{inr(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
