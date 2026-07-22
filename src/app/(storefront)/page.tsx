import Image from "next/image";
import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { CategoryShowcase } from "@/components/storefront/CategoryShowcase";
import { BrandMarquee } from "@/components/storefront/BrandMarquee";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { HeroMedia } from "@/components/storefront/HeroMedia";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "🔍",
    title: "Pick what your field needs",
    detail: "Browse seeds, fertilizers, crop protection and tools by category or search — real prices and stock, always up to date.",
  },
  {
    step: "02",
    icon: "🛒",
    title: "Order in minutes, no account needed",
    detail: "Add to cart and check out as a guest with just your name, phone and delivery address. No app to install, nothing to pay upfront.",
  },
  {
    step: "03",
    icon: "📦",
    title: "We pack it with care",
    detail: "Every order is checked and packed by hand — genuine, licensed products only, never substituted without telling you.",
  },
  {
    step: "04",
    icon: "🚚",
    title: "Delivered to your doorstep, pay on arrival",
    detail: "Cash on delivery, even in villages regular couriers skip. Track your order's status any time from the Orders tab.",
  },
];

export default async function HomePage() {
  const db = getDb();
  const [categories, products, cart] = await Promise.all([db.categories.list(), db.products.list(), getCartMap()]);
  const featured = products.slice(0, 8);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.slug]));
  const brands = products.map((p) => p.brand);
  const hasEnoughBrandsForMarquee = new Set(brands).size >= 3;

  return (
    <div className="pb-8 md:pb-0">
      <section className="relative overflow-hidden">
        <HeroMedia
          posterSrc="/images/hero-sunrise-paddy.jpg"
          posterAlt="Sunrise over a paddy field"
          videoSrc="/videos/hero-farm.mp4"
        />

        <div className="relative px-4 sm:px-8 lg:px-16 py-16 md:py-24 flex flex-col gap-5 max-w-xl">
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

      {hasEnoughBrandsForMarquee && (
        <section className="py-6 border-b border-border">
          <ScrollReveal className="mx-auto max-w-6xl px-4 flex flex-col gap-3">
            <span className="text-center text-xs font-medium text-muted uppercase tracking-wide">
              Genuine products from brands you already trust
            </span>
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

      <section className="py-14 bg-primary-50/60">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <ScrollReveal className="flex flex-col gap-4 order-2 md:order-1">
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
          </ScrollReveal>

          <ScrollReveal delayMs={120} className="relative h-72 md:h-96 order-1 md:order-2">
            <div
              aria-hidden
              className="float-organic-shadow absolute inset-4 md:inset-6 bg-primary-400/30 blur-2xl"
              style={{ borderRadius: "63% 37% 54% 46% / 43% 47% 53% 57%" }}
            />
            <div
              className="float-organic relative h-full w-full overflow-hidden shadow-card-hover"
              style={{ borderRadius: "63% 37% 54% 46% / 43% 47% 53% 57%" }}
            >
              <Image
                src="/images/trust-farmers-field-v2.jpg"
                alt="Farmers harvesting vegetables together in a field"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <ScrollReveal className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold tracking-wide uppercase text-primary-700">How it works</span>
          <h2 className="font-display font-bold text-3xl leading-snug text-foreground mt-2">
            From your cart to your courtyard
          </h2>
          <p className="text-muted text-[15px] leading-relaxed mt-2">
            No account, no upfront payment, no guessing when your order will arrive.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((item, i) => (
            <ScrollReveal
              key={item.step}
              delayMs={i * 100}
              className="relative flex flex-col gap-2 rounded-card border border-border bg-surface p-5"
            >
              <span className="absolute top-4 right-4 font-display font-extrabold text-2xl text-primary-100">
                {item.step}
              </span>
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-display font-semibold text-[15px] text-foreground mt-1">{item.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{item.detail}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <ScrollReveal className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center gap-1.5 rounded-card border border-border bg-surface p-5">
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-sm font-medium text-foreground">{badge.label}</span>
              <span className="text-xs text-muted leading-snug">{badge.detail}</span>
            </div>
          ))}
        </ScrollReveal>
      </section>
    </div>
  );
}
