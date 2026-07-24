"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Category, ProductWithVariants } from "@/types";

interface ShopBrowserProps {
  categories: Category[];
  products: ProductWithVariants[];
  cart: Record<string, number>;
  initialCategory?: string;
  q?: string;
}

/** Category pills filter client-side against the already-fetched product list — the server
 *  only ever refetches when the search query changes (typed in the header), not on every pill
 *  click, so switching categories is instant instead of a multi-second round trip. The URL
 *  still updates (via the History API directly, bypassing Next's router) so the active
 *  category stays shareable/bookmarkable without triggering a server re-render. */
export function ShopBrowser({ categories, products, cart, initialCategory, q }: ShopBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ?? null);
  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.slug])), [categories]);
  const activeCategory = categories.find((c) => c.slug === selectedCategory);

  const filteredProducts = useMemo(
    () => (selectedCategory ? products.filter((p) => categoryMap[p.categoryId] === selectedCategory) : products),
    [products, categoryMap, selectedCategory]
  );

  function selectCategory(slug: string | null) {
    setSelectedCategory(slug);
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (q) params.set("q", q);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/shop?${query}` : "/shop");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        {q ? (
          <>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Results for &ldquo;{q}&rdquo;
            </h1>
            <p className="text-sm text-muted mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found ·{" "}
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
        <button
          type="button"
          onClick={() => selectCategory(null)}
          aria-current={!selectedCategory ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
            !selectedCategory
              ? "bg-primary-700 text-white border-primary-700"
              : "bg-surface text-foreground border-border hover:border-primary-300"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCategory(c.slug)}
            aria-current={selectedCategory === c.slug ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              selectedCategory === c.slug
                ? "bg-primary-700 text-white border-primary-700"
                : "bg-surface text-foreground border-border hover:border-primary-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soil-100 text-2xl">🌱</span>
          <p className="text-muted text-sm max-w-xs">
            {q ? "No products matched your search." : "No products in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cart={cart}
              categorySlug={categoryMap[product.categoryId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
