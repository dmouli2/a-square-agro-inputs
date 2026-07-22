import Link from "next/link";
import type { Category } from "@/types";

const ICONS: Record<string, string> = {
  seeds: "🌱",
  fertilizers: "🌾",
  "crop-protection": "🛡️",
  "tools-equipment": "🧰",
};

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group flex flex-col items-center gap-2.5 rounded-card bg-surface border border-border p-4 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all duration-200"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl group-hover:bg-primary-100 transition-colors">
        {ICONS[category.slug] ?? "🌿"}
      </span>
      <span className="font-display font-semibold text-sm text-foreground text-center">{category.name}</span>
    </Link>
  );
}
