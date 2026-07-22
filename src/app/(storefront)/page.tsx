import Image from "next/image";
import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const TRUST_BADGES = [
  { icon: "✅", label: "Genuine, licensed products", detail: "Sourced directly from authorised brands" },
  { icon: "🚚", label: "Doorstep delivery to your village", detail: "We deliver where couriers won't go" },
  { icon: "💰", label: "Cash on delivery available", detail: "Pay when your order reaches you" },
  { icon: "📞", label: "Expert advice on call", detail: "Ask us before you buy, not after" },
];

const COMMUNITY_POINTS = [
  "Every product checked for genuine certification before it's listed",
  "Fair, transparent pricing — no last-minute markups at checkout",
  "Doorstep delivery, even to villages courier apps won't cover",
  "WhatsApp support to ask questions before you buy, not after",
];

export default async function HomePage() {
  const db = getDb();
  const [categories, products, cart] = await Promise.all([db.categories.list(), db.products.list(), getCartMap()]);
  const featured = products.slice(0, 8);

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

          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/shop" size="lg" variant="accent">
              Shop now
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
        <ProductCarousel products={featured} cart={cart} />
      </section>

      <section className="py-14 bg-primary-50/60">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4 order-2 md:order-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-primary-700">Our promise to you</span>
            <h2 className="font-display font-bold text-3xl leading-snug text-foreground">
              A Square Farmer Promise
            </h2>
            <p className="text-muted text-[15px] leading-relaxed">
              We started A Square Agro Inputs to close the gap between what farmers actually
              need and what gets pushed on them.
            </p>
            <ul className="flex flex-col gap-2.5 mt-1">
              {COMMUNITY_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white text-[11px]">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <ButtonLink href="/shop" variant="accent" size="md" className="w-fit mt-2">
              Explore the catalog
            </ButtonLink>
          </div>

          <div
            className="relative h-72 md:h-96 order-1 md:order-2 overflow-hidden"
            style={{ borderRadius: "63% 37% 54% 46% / 43% 47% 53% 57%" }}
          >
            <Image
              src="/images/trust-farmers-field.jpg"
              alt="Farmers working together in a field"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
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
