import Image from "next/image";
import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SearchBar } from "@/components/storefront/SearchBar";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const TRUST_BADGES = [
  { icon: "✅", label: "Genuine, licensed products", detail: "Sourced directly from authorised brands" },
  { icon: "🚚", label: "Doorstep delivery to your village", detail: "We deliver where couriers won't go" },
  { icon: "💰", label: "Cash on delivery available", detail: "Pay when your order reaches you" },
  { icon: "📞", label: "Expert advice on call", detail: "Ask us before you buy, not after" },
];

function lowestPricedVariant(product: { variants: { id: string; price: number }[] }) {
  return [...product.variants].sort((a, b) => a.price - b.price)[0];
}

export default async function HomePage() {
  const db = getDb();
  const [categories, products, cart] = await Promise.all([db.categories.list(), db.products.list(), getCartMap()]);
  const featured = products.slice(0, 4);

  return (
    <div className="pb-8 md:pb-0">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-sunrise-paddy.jpg"
            alt="Sunrise over a paddy field"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/85 via-primary-900/70 to-primary-800/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 flex flex-col gap-5 md:max-w-xl">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium tracking-wide text-white">
            🌾 Built for the farmer, not the middleman
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-tight text-white">
            From the soil up, everything your fields need.
          </h1>
          <p className="text-white/90 text-[15px] md:text-base leading-relaxed">
            Certified seeds, fertilizers, crop protection and farm equipment — sourced from
            trusted brands, priced fairly, and delivered straight to your village.
          </p>

          <div className="pt-1 max-w-md">
            <SearchBar size="lg" placeholder="Search for DAP, paddy seeds, sprayers…" />
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/shop" size="lg" variant="accent">
              Shop now
            </ButtonLink>
            <ButtonLink href="/shop?category=seeds" size="lg" variant="secondary" className="bg-white/10 text-white border-white/25 hover:bg-white/20">
              Browse seeds
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Popular right now</h2>
            <p className="text-sm text-muted mt-0.5">Handpicked essentials for this season</p>
          </div>
          <ButtonLink href="/shop" variant="ghost" size="sm">
            View all →
          </ButtonLink>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} cartQuantity={cart[lowestPricedVariant(product).id] ?? 0} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-card grid md:grid-cols-2">
          <div className="relative min-h-56 md:min-h-full">
            <Image
              src="/images/trust-farmers-field.jpg"
              alt="Farmers working together in a field"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="bg-primary-900 text-white p-7 md:p-10 flex flex-col justify-center gap-3">
            <span className="text-xs font-semibold tracking-wide uppercase text-accent-400">Why farmers choose us</span>
            <h2 className="font-display font-bold text-2xl leading-snug">
              We know the difference between a good season and a hard one.
            </h2>
            <p className="text-primary-50/85 text-[15px] leading-relaxed">
              A Square Agro Inputs was started to close the gap between what farmers actually
              need and what gets pushed on them. Every product we list is checked for genuine
              certification and stocked at a fair price — no unnecessary upselling, no
              expired stock, no guesswork.
            </p>
            <ButtonLink href="/shop" variant="accent" size="md" className="w-fit mt-2">
              Explore the catalog
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center gap-1.5 rounded-card border border-border bg-surface p-5">
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-sm font-medium text-foreground">{badge.label}</span>
              <span className="text-xs text-muted leading-snug">{badge.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
