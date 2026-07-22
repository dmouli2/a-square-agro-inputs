import Link from "next/link";
import Image from "next/image";
import type { ProductWithVariants } from "@/types";
import { getImageStorage } from "@/lib/storage";
import { ProductCardActions } from "./ProductCardActions";

export function ProductCard({ product, cart = {} }: { product: ProductWithVariants; cart?: Record<string, number> }) {
  const allOutOfStock = product.variants.every((v) => v.stockQty === 0);
  const imageUrl = product.images[0] ? getImageStorage().getPublicUrl(product.images[0]) : null;

  return (
    <div className="group flex h-full flex-col rounded-card bg-surface border border-border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
            />
          ) : (
            <span className="font-display font-bold text-3xl text-primary-300 select-none">
              {product.brand.slice(0, 1)}
            </span>
          )}

          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />

          {allOutOfStock ? (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-foreground/80 text-white text-[11px] font-medium px-2.5 py-1">
              Out of stock
            </span>
          ) : (
            product.isBestseller && (
              <span className="absolute top-2.5 left-2.5 rounded-md bg-accent-400 text-primary-900 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 shadow-sm">
                Bestseller
              </span>
            )
          )}
        </div>
        <div className="flex flex-col gap-1 p-3.5 pb-2 min-h-[5.25rem]">
          <span className="text-xs font-medium text-muted uppercase tracking-wide">{product.brand}</span>
          <h3 className="font-display font-semibold text-[15px] leading-snug text-foreground line-clamp-2 group-hover:text-primary-700 transition-colors">
            {product.name}
          </h3>
        </div>
      </Link>

      <div className="px-3.5 pb-3.5 mt-auto">
        <ProductCardActions variants={product.variants} cart={cart} />
      </div>
    </div>
  );
}
