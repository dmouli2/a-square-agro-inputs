import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { CategoryShowcase } from "@/components/storefront/CategoryShowcase";
import { BrandMarquee } from "@/components/storefront/BrandMarquee";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The catalog-dependent slice of the homepage — brand marquee, "Popular right now" and
 * "Shop by category" — split out from page.tsx so it can sit behind its own <Suspense>
 * boundary. The hero (and everything static below this) has no data dependency and would
 * otherwise be held hostage by these Supabase calls before a single byte could stream.
 */
export async function HomeCatalogSections() {
  const db = getDb();
  const [categories, products, cart] = await Promise.all([db.categories.list(), db.products.list(), getCartMap()]);
  const featured = products.slice(0, 8);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.slug]));
  const brands = products.map((p) => p.brand);
  const hasEnoughBrandsForMarquee = new Set(brands).size >= 3;

  return (
    <>
      {hasEnoughBrandsForMarquee && (
        <section className="py-6 border-b border-border">
          <ScrollReveal className="mx-auto max-w-6xl px-4">
            <BrandMarquee brands={brands} />
          </ScrollReveal>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-6">
        <ScrollReveal className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Popular right now</h2>
            <p className="text-sm text-muted mt-0.5">Handpicked essentials for this season</p>
          </div>
          <ButtonLink href="/shop" variant="ghost" size="sm">
            View all →
          </ButtonLink>
        </ScrollReveal>
        <ProductCarousel products={featured} cart={cart} categoryMap={categoryMap} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <ScrollReveal className="mb-5">
          <h2 className="font-display font-bold text-xl text-foreground">Shop by category</h2>
          <p className="text-sm text-muted mt-0.5">Everything organised the way your field work is</p>
        </ScrollReveal>
        <CategoryShowcase categories={categories} />
      </section>
    </>
  );
}
