"use client";

import { useState, useTransition } from "react";
import type { ProductVariant } from "@/types";
import { PriceTag } from "./PriceTag";
import { Button, ButtonLink } from "@/components/ui/Button";
import { addToCart } from "@/app/actions/cart";

interface ProductPurchasePanelProps {
  variants: ProductVariant[];
  initialCartQuantities: Record<string, number>;
}

export function ProductPurchasePanel({ variants, initialCartQuantities }: ProductPurchasePanelProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [cartQuantities, setCartQuantities] = useState(initialCartQuantities);
  const [isPending, startTransition] = useTransition();
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const inStock = selected.stockQty > 0;
  const inCartQty = cartQuantities[selected.id] ?? 0;

  function handleAddToCart() {
    startTransition(async () => {
      await addToCart(selected.id, quantity);
      setCartQuantities((prev) => ({ ...prev, [selected.id]: (prev[selected.id] ?? 0) + quantity }));
      setQuantity(1);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PriceTag price={selected.price} mrp={selected.mrp} />

      {variants.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Pack size</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`rounded-control px-3.5 py-2 text-sm font-medium border transition-colors ${
                  v.id === selected.id
                    ? "bg-primary-700 text-white border-primary-700"
                    : "bg-surface text-foreground border-border hover:border-primary-300"
                } ${v.stockQty === 0 ? "opacity-40" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {inCartQty > 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-primary-200 bg-primary-50 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white text-sm">
            ✓
          </span>
          <span className="flex-1 text-sm font-medium text-primary-900">{inCartQty} in your cart</span>
          <ButtonLink href="/cart" size="sm" variant="primary">
            Go to cart
          </ButtonLink>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-control border border-border h-11">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-full text-lg text-foreground/70 hover:text-foreground"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-full text-lg text-foreground/70 hover:text-foreground"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <Button size="lg" className="flex-1" disabled={!inStock || isPending} onClick={handleAddToCart}>
            {!inStock ? "Out of stock" : isPending ? "Adding…" : "Add to cart"}
          </Button>
        </div>
      )}
    </div>
  );
}
