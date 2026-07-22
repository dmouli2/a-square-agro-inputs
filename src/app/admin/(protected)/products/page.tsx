import Link from "next/link";
import { getDb } from "@/lib/db";
import { ButtonLink } from "@/components/ui/Button";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary-50 text-primary-700",
  draft: "bg-amber-50 text-amber-700",
  archived: "bg-gray-100 text-gray-600",
};

export default async function AdminProductsPage() {
  const db = getDb();
  const [products, categories] = await Promise.all([db.products.listAll(), db.categories.list()]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-foreground">Products</h1>
        <ButtonLink href="/admin/products/new">+ New product</ButtonLink>
      </div>

      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pack sizes</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);
              return (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}/edit`} className="font-medium text-foreground hover:text-primary-700">
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted">{product.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{categoryName(product.categoryId)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[product.status]}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{product.variants.length}</td>
                  <td className="px-4 py-3 text-muted">{totalStock}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-sm text-muted p-6 text-center">No products yet.</p>}
      </div>
    </div>
  );
}
