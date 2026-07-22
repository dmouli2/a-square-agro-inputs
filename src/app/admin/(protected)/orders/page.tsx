import Link from "next/link";
import { getDb } from "@/lib/db";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  packed: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-primary-50 text-primary-700",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-red-50 text-red-700",
};

export default async function AdminOrdersPage() {
  const orders = await getDb().orders.list();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">Orders</h1>

      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:text-primary-700">
                    #{order.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-muted">{order.shippingAddress.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-sm text-muted p-6 text-center">No orders yet.</p>}
      </div>
    </div>
  );
}
