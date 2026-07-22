"use client";

import { useState } from "react";
import Image from "next/image";
import { getCategoryFallbackImage } from "@/lib/categoryImages";

export function ProductImageGallery({
  imageUrls,
  brandInitial,
  productName,
  categorySlug,
}: {
  imageUrls: string[];
  brandInitial: string;
  productName: string;
  categorySlug?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (imageUrls.length === 0) {
    const fallbackImage = getCategoryFallbackImage(categorySlug);
    if (fallbackImage) {
      return (
        <div className="relative aspect-square rounded-card overflow-hidden bg-primary-50">
          <Image
            src={fallbackImage}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-black/10" aria-hidden />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white tracking-wide">
            Representative photo — actual pack may vary
          </span>
        </div>
      );
    }
    return (
      <div className="aspect-square rounded-card bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <span className="font-display font-bold text-6xl text-primary-300 select-none">{brandInitial}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square rounded-card overflow-hidden bg-primary-50">
        <Image src={imageUrls[activeIndex]} alt={productName} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
      {imageUrls.length > 1 && (
        <div className="flex gap-2">
          {imageUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 rounded-control overflow-hidden border-2 transition-colors ${
                i === activeIndex ? "border-primary-600" : "border-transparent"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
