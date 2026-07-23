import Link from "next/link";
import { getDb } from "@/lib/db";
import { getRememberedPhone, isValidPhone } from "@/lib/orderLookup";
import { ButtonLink } from "@/components/ui/Button";
import type { Order } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  packed: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-primary-50 text-primary-700",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-red-50 text-red-700",
};

const inr = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function PhoneLookupForm({ defaultPhone, error }: { defaultPhone?: string; error?: string }) {
  return (
    <form action="/orders" method="GET" className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="tel"
          name="phone"
          inputMode="numeric"
          defaultValue={defaultPhone}
          placeholder="10-digit phone number"
          aria-label="Phone number"
          className="h-11 flex-1 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          type="submit"
          className="h-11 rounded-control bg-primary-700 text-white text-sm font-medium px-5 hover:bg-primary-800"
        >
          Find orders
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Link
      href={`/orders/${order.id}`}
      className="rounded-card border border-border bg-surface p-4 flex flex-col gap-2 hover:border-primary-200 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-sm text-foreground">#{order.id}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
          {order.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="font-medium text-foreground">{inr(order.total)}</span>
      </div>
    </Link>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone: phoneParam } = await searchParams;
  const invalidParam = phoneParam !== undefined && !isValidPhone(phoneParam);
  const phone = isValidPhone(phoneParam) ? phoneParam : await getRememberedPhone();
  const orders = phone ? await getDb().orders.listByPhone(phone) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-24 md:pb-10 flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Your orders</h1>
        <p className="text-sm text-muted mt-1">
          {phone
            ? `Showing orders placed with ${phone}.`
            : "No account needed — enter the phone number you used at checkout."}
        </p>
      </div>

      <PhoneLookupForm
        defaultPhone={phone ?? undefined}
        error={invalidParam ? "Please enter a valid 10-digit phone number." : undefined}
      />

      {orders === null ? null : orders.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-4 py-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soil-100 text-4xl">📦</span>
          <p className="text-sm text-muted max-w-xs">
            No orders found for {phone}. If you just placed one, it can take a moment to appear.
          </p>
          <ButtonLink href="/shop" size="lg" variant="secondary">
            Continue browsing
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
