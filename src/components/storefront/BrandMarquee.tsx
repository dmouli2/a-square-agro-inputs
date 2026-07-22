/**
 * Auto-scrolling strip of the brands actually carried in the catalog (real product data,
 * not invented). Pure CSS animation — no client JS needed — pauses on hover/focus and
 * collapses to a static wrapped row under prefers-reduced-motion (see globals.css).
 */
export function BrandMarquee({ brands }: { brands: string[] }) {
  const uniqueBrands = Array.from(new Set(brands)).sort((a, b) => a.localeCompare(b));
  if (uniqueBrands.length < 3) return null;

  const group = (hidden: boolean) => (
    <div className="marquee-group flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {uniqueBrands.map((brand) => (
        <span
          key={brand}
          className="shrink-0 font-display font-semibold text-lg text-foreground/40 tracking-wide"
        >
          {brand}
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent"
      />
      <div className="marquee-track flex w-max" aria-label={`Brands we stock: ${uniqueBrands.join(", ")}`}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
