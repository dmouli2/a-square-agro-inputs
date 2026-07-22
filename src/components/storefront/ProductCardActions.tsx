"use client";

import { useState, useTransition } from "react";
import type { ProductVariant } from "@/types";
import { PriceTag } from "./PriceTag";
import { addToCart, updateCartQuantity } from "@/app/actions/cart";

const CART_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3h2l.4 2M7 13h10l3.6-7.5H5.4M7 13L5.4 5.5M7 13l-1.5 3H18M9.5 20a1 1 0 100-2 1 1 0 000 2zM17.5 20a1 1 0 100-2 1 1 0 000 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function lowestPricedVariant(variants: ProductVariant[]) {
  return [...variants].sort((a, b) => a.price - b.price)[0];
}

interface ProductCardActionsProps {
  variants: ProductVariant[];
  cart: Record<string, number>;
}

export function ProductCardActions({ variants, cart }: ProductCardActionsProps) {
  const [selectedId, setSelectedId] = useState(lowestPricedVariant(variants).id);
  const [isPending, startTransition] = useTransition();
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const inStock = selected.stockQty > 0;
  const quantity = cart[selected.id] ?? 0;

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function add() {
    startTransition(() => {
      addToCart(selected.id, 1);
    });
  }

  function change(next: number) {
    startTransition(() => {
      updateCartQuantity(selected.id, next);
    });
  }

  return (
    <div className="flex flex-col gap-2.5" onClick={stop}>
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={(e) => {
                stop(e);
                setSelectedId(v.id);
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                v.id === selected.id
                  ? "bg-primary-700 text-white border-primary-700"
                  : "bg-surface text-foreground border-border hover:border-primary-300"
              } ${v.stockQty === 0 ? "opacity-40" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <PriceTag price={selected.price} mrp={selected.mrp} />

      {!inStock ? (
        <span className="flex h-10 items-center justify-center rounded-full bg-border text-muted text-xs font-bold uppercase tracking-wide">
          Out of stock
        </span>
      ) : quantity === 0 ? (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            add();
          }}
          disabled={isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary-700 text-white text-xs font-bold uppercase tracking-wide hover:bg-primary-800 active:bg-primary-900 transition-colors disabled:opacity-60"
        >
          {CART_ICON}
          Add to cart
        </button>
      ) : (
        <div className="flex h-10 items-center justify-between rounded-full bg-primary-700 text-white px-1">
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              change(quantity - 1);
            }}
            disabled={isPending}
            aria-label="Decrease quantity"
            className="flex h-8 w-9 items-center justify-center text-lg disabled:opacity-60"
          >
            −
          </button>
          <span className="text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              change(quantity + 1);
            }}
            disabled={isPending}
            aria-label="Increase quantity"
            className="flex h-8 w-9 items-center justify-center text-lg disabled:opacity-60"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
