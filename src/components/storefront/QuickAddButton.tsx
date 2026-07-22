"use client";

import { useState, useTransition } from "react";
import { addToCart, updateCartQuantity } from "@/app/actions/cart";

interface QuickAddButtonProps {
  variantId: string;
  initialQuantity: number;
  disabled?: boolean;
}

export function QuickAddButton({ variantId, initialQuantity, disabled = false }: QuickAddButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function add() {
    setQuantity((q) => q + 1);
    startTransition(() => {
      addToCart(variantId, 1);
    });
  }

  function change(next: number) {
    setQuantity(next);
    startTransition(() => {
      updateCartQuantity(variantId, next);
    });
  }

  if (disabled) return null;

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          add();
        }}
        disabled={isPending}
        aria-label="Add to cart"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-700 shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 active:scale-95 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div
      onClick={stop}
      className="flex items-center gap-1 rounded-full bg-primary-700 text-white shadow-md px-1 h-9"
    >
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          change(quantity - 1);
        }}
        disabled={isPending}
        aria-label="Decrease quantity"
        className="flex h-7 w-7 items-center justify-center text-base disabled:opacity-60"
      >
        −
      </button>
      <span className="w-4 text-center text-xs font-semibold">{quantity}</span>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          change(quantity + 1);
        }}
        disabled={isPending}
        aria-label="Increase quantity"
        className="flex h-7 w-7 items-center justify-center text-base disabled:opacity-60"
      >
        +
      </button>
    </div>
  );
}
