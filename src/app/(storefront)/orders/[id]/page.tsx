import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { ButtonLink } from "@/components/ui/Button";
import { STORE_WHATSAPP_NUMBER, buildWaLink, orderSummaryMessage } from "@/lib/whatsapp";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getDb().orders.findById(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-24 md:pb-10">
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <span className="text-4xl">✅</span>
        <h1 className="font-display font-bold text-2xl text-foreground">Order placed!</h1>
        <p className="text-sm text-muted">
          Order <span className="font-medium text-foreground">#{order.id}</span> — we&apos;ll call you to confirm
          delivery.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface px-4 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
            <div>
              <p className="font-display font-semibold text-sm text-foreground">{item.productName}</p>
              <p className="text-xs text-muted">
                {item.variantLabel} × {item.quantity}
              </p>
            </div>
            <span className="font-medium text-sm text-foreground">
              {(item.priceAtPurchase * item.quantity).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-4 mb-4 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="text-foreground">
            {order.subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-foreground">Total (Cash on Delivery)</span>
          <span className="text-foreground">
            {order.total.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="rounded-card border border-border bg-primary-50/50 p-4 mb-8 text-sm">
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

      <a
        href={buildWaLink(STORE_WHATSAPP_NUMBER, orderSummaryMessage(order))}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 flex h-13 w-full items-center justify-center gap-2 rounded-control bg-[#25D366] text-white text-base font-medium hover:brightness-95 transition"
      >
        Send order on WhatsApp
      </a>
      <p className="text-xs text-muted text-center mb-6">
        Sends your order summary to our WhatsApp — fastest way to confirm and ask questions.
      </p>

      <ButtonLink href="/shop" size="lg" className="w-full justify-center">
        Continue shopping
      </ButtonLink>
    </div>
  );
}
