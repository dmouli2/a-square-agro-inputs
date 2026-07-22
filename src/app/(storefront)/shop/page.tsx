import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SearchBar } from "@/components/storefront/SearchBar";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const db = getDb();
  const [categories, products, cart] = await Promise.all([
    db.categories.list(),
    db.products.list({ categorySlug: category, search: q }),
    getCartMap(),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      <div className="hidden md:block mb-5">
        <SearchBar defaultValue={q} />
      </div>

      <div className="mb-6">
        {q ? (
          <>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Results for &ldquo;{q}&rdquo;
            </h1>
            <p className="text-sm text-muted mt-1">
              {products.length} {products.length === 1 ? "product" : "products"} found ·{" "}
              <Link href="/shop" className="text-primary-700 hover:underline">
                Clear search
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display font-bold text-2xl text-foreground">
              {activeCategory ? activeCategory.name : "Shop all products"}
            </h1>
            {activeCategory?.description && (
              <p className="text-sm text-muted mt-1">{activeCategory.description}</p>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <Link
          href={q ? `/shop?q=${encodeURIComponent(q)}` : "/shop"}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
            !category
              ? "bg-primary-700 text-white border-primary-700"
              : "bg-surface text-foreground border-border hover:border-primary-300"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={q ? `/shop?category=${c.slug}&q=${encodeURIComponent(q)}` : `/shop?category=${c.slug}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              category === c.slug
                ? "bg-primary-700 text-white border-primary-700"
                : "bg-surface text-foreground border-border hover:border-primary-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-muted text-sm py-12 text-center">
          {q ? "No products matched your search." : "No products in this category yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} cart={cart} />
          ))}
        </div>
      )}
    </div>
  );
}
