import Link from "next/link";
import { getDb } from "@/lib/db";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/admin/Pagination";
import { paginate, parsePage } from "@/lib/pagination";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary-50 text-primary-700",
  draft: "bg-amber-50 text-amber-700",
  archived: "bg-gray-100 text-gray-600",
};

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q, page: pageParam } = await searchParams;
  const db = getDb();
  const [allProducts, categories] = await Promise.all([db.products.listAll(), db.categories.list()]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const query = q?.trim().toLowerCase();
  const filtered = query
    ? allProducts.filter((p) => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    : allProducts;

  const page = parsePage(pageParam, filtered.length);
  const { items: products, totalPages } = paginate(filtered, page);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display font-bold text-2xl text-foreground">Products</h1>
        <ButtonLink href="/admin/products/new">+ New product</ButtonLink>
      </div>

      <form action="/admin/products" method="GET" className="flex gap-2 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or brand…"
          aria-label="Search products"
          className="h-10 flex-1 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          type="submit"
          className="h-10 rounded-control bg-primary-700 text-white text-sm font-medium px-4 hover:bg-primary-800"
        >
          Search
        </button>
      </form>

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
        {filtered.length === 0 && (
          <p className="text-sm text-muted p-6 text-center">
            {query ? `No products match "${q}".` : "No products yet."}
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} basePath="/admin/products" searchParams={{ q }} />
      </div>
    </div>
  );
}
