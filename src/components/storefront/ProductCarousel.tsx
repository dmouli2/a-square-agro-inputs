"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductWithVariants } from "@/types";
import { ProductCard } from "./ProductCard";

const CHEVRON_LEFT = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ProductCarouselProps {
  products: ProductWithVariants[];
  cart?: Record<string, number>;
}

export function ProductCarousel({ products, cart = {} }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10 bg-gradient-to-r from-background to-transparent md:from-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-background to-transparent md:from-transparent"
      />

      <div
        ref={trackRef}
        className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 snap-start w-[72%] sm:w-[45%] md:w-[31%] lg:w-[23%]"
          >
            <ProductCard product={product} cart={cart} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll to previous products"
        disabled={!canScrollPrev}
        className="hidden md:flex absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground shadow-card border border-border hover:bg-primary-50 hover:text-primary-700 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
      >
        {CHEVRON_LEFT}
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Scroll to more products"
        disabled={!canScrollNext}
        className="hidden md:flex absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground shadow-card border border-border hover:bg-primary-50 hover:text-primary-700 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
      >
        {CHEVRON_RIGHT}
      </button>
    </div>
  );
}
