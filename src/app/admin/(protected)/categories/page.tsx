import Link from "next/link";
import { getDb } from "@/lib/db";
import { deleteCategory } from "@/app/actions/categories";
import { ButtonLink } from "@/components/ui/Button";

export default async function AdminCategoriesPage() {
  const db = getDb();
  const [categories, products] = await Promise.all([db.categories.list(), db.products.listAll()]);
  const productCount = (categoryId: string) => products.filter((p) => p.categoryId === categoryId).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-foreground">Categories</h1>
        <ButtonLink href="/admin/categories/new">+ New category</ButtonLink>
      </div>

      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const count = productCount(category.id);
              return (
                <tr key={category.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="font-medium text-foreground hover:text-primary-700"
                    >
                      {category.name}
                    </Link>
                    {category.description ? <p className="text-xs text-muted">{category.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{category.slug}</td>
                  <td className="px-4 py-3 text-muted">{category.sortOrder ?? 0}</td>
                  <td className="px-4 py-3 text-muted">{count}</td>
                  <td className="px-4 py-3 text-right">
                    {count === 0 ? (
                      <form action={deleteCategory.bind(null, category.id)} className="inline">
                        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">in use</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No categories yet — create the first one.</p>
        ) : null}
      </div>
    </div>
  );
}
