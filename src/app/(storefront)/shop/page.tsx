import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { ShopBrowser } from "@/components/storefront/ShopBrowser";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const db = getDb();
  // categorySlug is deliberately not passed to products.list() — the full (or search-matched)
  // set is fetched once and ShopBrowser filters by category client-side, so switching category
  // pills doesn't cost a server round trip. Only `q` changing (typed in the header) re-fetches.
  const [categories, products, cart] = await Promise.all([
    db.categories.list(),
    db.products.list({ search: q }),
    getCartMap(),
  ]);

  return <ShopBrowser categories={categories} products={products} cart={cart} initialCategory={category} q={q} />;
}
