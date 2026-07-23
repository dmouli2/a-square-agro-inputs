/**
 * The site's signature transition: a literal cross-section of soil strata — topsoil down to
 * pale subsoil — with a seedling breaking through the surface. Used once, at the one point on
 * the homepage where the page moves from "here's what we sell" into the brand-promise story,
 * so the transition itself says "from the soil up" instead of just the hero copy.
 */
export function SoilHorizon() {
  return (
    <div aria-hidden className="relative h-14 md:h-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--soil-700) 0%, var(--soil-500) 45%, var(--soil-300) 78%, var(--soil-100) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply"
          style={{
            backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 5px, rgba(0,0,0,0.4) 6px)",
          }}
        />
      </div>
      <svg
        viewBox="0 0 64 64"
        className="absolute left-1/2 top-0 h-9 w-9 md:h-12 md:w-12 -translate-x-1/2 -translate-y-1/2 text-primary-500"
        fill="currentColor"
      >
        <path d="M31 60V30h2v30h-2Z" />
        <path d="M32 34C20 34 14 26 14 16c12 0 18 8 18 18Z" />
        <path d="M32 30c0-11 9-15 17-14-1 10-7 16-17 14Z" />
      </svg>
    </div>
  );
}
