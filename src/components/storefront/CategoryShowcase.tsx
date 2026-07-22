import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";
import { getCategoryFallbackImage } from "@/lib/categoryImages";
import { CATEGORY_ICONS } from "./CategoryCard";

/**
 * A bigger, photo-led alternative to the compact icon grid at the top of the homepage —
 * meant to be skimmed visually rather than read, further down the page once a visitor has
 * already seen the catalog. Categories with no licensed photo yet (see categoryImages.ts)
 * fall back to a plain icon tile instead of guessing an image.
 */
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => {
        const photo = getCategoryFallbackImage(category.slug);
        return (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="group relative flex h-40 items-end overflow-hidden rounded-card shadow-card hover:shadow-card-hover transition-shadow"
          >
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-50" />
            )}

            <div className="relative flex items-center gap-2 p-4">
              <span className="text-xl">{CATEGORY_ICONS[category.slug] ?? "🌿"}</span>
              <span className={`font-display font-semibold text-sm ${photo ? "text-white" : "text-foreground"}`}>
                {category.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
