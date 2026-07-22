/**
 * Fallback catalog photography, keyed by category slug — shown on product cards/galleries
 * when a product has no uploaded photo of its own. These are deliberately evocative
 * category shots (a field, tools, an application in progress) rather than fake packshots:
 * guessing a specific brand/pack photo for a SKU we don't have art for risks showing the
 * wrong product. Licensed for commercial use; see public/images/categories/CREDITS.md.
 */
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  seeds: "/images/categories/seeds.jpg",
  fertilizers: "/images/categories/fertilizers.jpg",
  "crop-protection": "/images/categories/crop-protection.jpg",
  "tools-equipment": "/images/categories/tools-equipment.jpg",
};

export function getCategoryFallbackImage(categorySlug?: string | null): string | null {
  if (!categorySlug) return null;
  return CATEGORY_FALLBACK_IMAGES[categorySlug] ?? null;
}
