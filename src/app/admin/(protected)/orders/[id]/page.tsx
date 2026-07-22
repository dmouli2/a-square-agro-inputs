import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { updateOrderStatus } from "@/app/actions/adminOrders";
import { buildWaLink, customerWaNumber, statusUpdateMessage } from "@/lib/whatsapp";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getDb().orders.findById(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Order #{order.id}</h1>
        <p className="text-sm text-muted mt-1">Placed {new Date(order.createdAt).toLocaleString("en-IN")}</p>
      </div>

      <div className="rounded-card border border-border bg-surface p-4 flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Status</span>
        <form action={updateOrderStatus.bind(null, order.id)} className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={order.status}
            className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 rounded-control bg-primary-700 text-white text-sm font-medium px-4 hover:bg-primary-800"
          >
            Update
          </button>
        </form>
        <a
          href={buildWaLink(customerWaNumber(order.shippingAddress.phone), statusUpdateMessage(order))}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-control bg-[#25D366] px-4 text-sm font-medium text-white hover:brightness-95"
        >
          Notify customer
        </a>
      </div>

      <div className="rounded-card border border-border bg-surface px-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
            <div>
              <p className="font-medium text-sm text-foreground">{item.productName}</p>
              <p className="text-xs text-muted">
                {item.variantLabel} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-medium text-foreground">
              {(item.priceAtPurchase * item.quantity).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-4 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="text-foreground">
            {order.subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-foreground">Total (COD)</span>
          <span className="text-foreground">
            {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4 text-sm">
        <span className="font-semibold text-foreground block mb-1">Delivering to</span>
        <p className="text-muted leading-relaxed">
          {order.shippingAddress.fullName}, {order.shippingAddress.phone}
          <br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          {order.shippingAddress.village ? `, ${order.shippingAddress.village}` : ""}
          <br />
          {order.shippingAddress.district}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
        </p>
      </div>
    </div>
  );
}
