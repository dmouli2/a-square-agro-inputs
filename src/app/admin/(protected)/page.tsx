import Link from "next/link";
import { getDb } from "@/lib/db";

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
        <p className="font-display font-bold text-2xl text-foreground mt-1">
          {revenue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
        </p>
      </div>

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
                <span className="font-medium text-foreground">
                  {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
