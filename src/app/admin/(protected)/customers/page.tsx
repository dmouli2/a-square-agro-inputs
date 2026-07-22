import { getDb } from "@/lib/db";

const inr = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function AdminCustomersPage() {
  const customers = await getDb().customers.list();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">Customers</h1>

      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{customer.fullName}</p>
                  {customer.email ? <p className="text-xs text-muted">{customer.email}</p> : null}
                </td>
                <td className="px-4 py-3 text-muted">{customer.phone}</td>
                <td className="px-4 py-3 text-muted">{customer.orderCount}</td>
                <td className="px-4 py-3 font-medium text-foreground">{inr(customer.totalSpent)}</td>
                <td className="px-4 py-3 text-muted">
                  {customer.lastOrderAt
                    ? new Date(customer.lastOrderAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No customers yet — they appear here after their first order.</p>
        ) : null}
      </div>
    </div>
  );
}
