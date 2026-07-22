"use client";

import { useTransition } from "react";
import { removeFromCart, updateCartQuantity } from "@/app/actions/cart";

interface CartLineItemProps {
  variantId: string;
  productName: string;
  brand: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

export function CartLineItem({ variantId, productName, brand, variantLabel, price, quantity }: CartLineItemProps) {
  const [isPending, startTransition] = useTransition();

  function setQuantity(next: number) {
    startTransition(() => {
      updateCartQuantity(variantId, next);
    });
  }

  function remove() {
    startTransition(() => {
      removeFromCart(variantId);
    });
  }

  return (
    <div className={`flex gap-3 py-4 border-b border-border last:border-0 ${isPending ? "opacity-50" : ""}`}>
      <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <span className="font-display font-bold text-lg text-primary-300">{brand.slice(0, 1)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{brand}</span>
        <h3 className="font-display font-semibold text-sm text-foreground truncate">{productName}</h3>
        <p className="text-xs text-muted mt-0.5">{variantLabel}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center rounded-control border border-border h-8">
            <button
              type="button"
              onClick={() => setQuantity(quantity - 1)}
              className="w-7 h-full text-sm text-foreground/70 hover:text-foreground"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-xs font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-full text-sm text-foreground/70 hover:text-foreground"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="font-display font-semibold text-sm text-foreground">
            {(price * quantity).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={remove}
        aria-label="Remove item"
        className="self-start text-muted hover:text-red-600 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
