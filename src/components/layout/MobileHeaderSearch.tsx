"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/storefront/Logo";
import { useCartCount } from "@/components/storefront/CartCountContext";

const SEARCH_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const BACK_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CART_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 3h2l.4 2M7 13h10l3.6-7.5H5.4M7 13L5.4 5.5M7 13l-1.5 3H18M9.5 20a1 1 0 100-2 1 1 0 000 2zM17.5 20a1 1 0 100-2 1 1 0 000 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MobileHeaderSearch() {
  const { count: cartCount } = useCartCount();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (isOpen) {
    return (
      <form action="/shop" method="GET" role="search" className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-foreground/80 hover:bg-primary-50 hover:text-primary-700 transition-colors"
        >
          {BACK_ICON}
        </button>
        <input
          ref={inputRef}
          type="search"
          name="q"
          placeholder="Search seeds, fertilizers, sprayers…"
          aria-label="Search products"
          className="h-10 min-w-0 flex-1 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
        />
      </form>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Logo />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open search"
          className="flex h-10 w-10 items-center justify-center rounded-control text-foreground/80 hover:bg-primary-50 hover:text-primary-700 transition-colors"
        >
          {SEARCH_ICON}
        </button>
        <Link
          href="/cart"
          aria-label="Cart"
          className="relative flex h-10 w-10 items-center justify-center rounded-control hover:bg-primary-50 text-foreground/80 hover:text-primary-700 transition-colors"
        >
          {CART_ICON}
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-primary-900">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
