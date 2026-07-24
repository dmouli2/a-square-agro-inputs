"use client";

import { useOptimistic, useTransition } from "react";
import { removeFromCart, updateCartQuantity } from "@/app/actions/cart";
import { CartLineItem } from "./CartLineItem";
import { CheckoutForm } from "./CheckoutForm";
import { useCartCount } from "./CartCountContext";
import { ButtonLink } from "@/components/ui/Button";

export interface CartItemData {
  variantId: string;
  productName: string;
  brand: string;
  variantLabel: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

type ItemsAction = { type: "setQuantity"; variantId: string; quantity: number } | { type: "remove"; variantId: string };

function reduceItems(items: CartItemData[], action: ItemsAction): CartItemData[] {
  if (action.type === "remove") return items.filter((item) => item.variantId !== action.variantId);
  return items.map((item) => (item.variantId === action.variantId ? { ...item, quantity: action.quantity } : item));
}

/** Owns the cart page's item list as optimistic client state — quantity changes and removals
 *  update the list (and the derived subtotal fed to CheckoutForm) immediately, with the actual
 *  Server Action running in the background instead of the user waiting on it. */
export function CartItemsList({ initialItems }: { initialItems: CartItemData[] }) {
  const [, startTransition] = useTransition();
  const { bump } = useCartCount();
  const [items, dispatch] = useOptimistic(initialItems, reduceItems);

  function handleQuantityChange(variantId: string, currentQuantity: number, next: number) {
    const delta = next - currentQuantity;
    if (next <= 0) {
      startTransition(async () => {
        dispatch({ type: "remove", variantId });
        bump(delta);
        await removeFromCart(variantId);
      });
      return;
    }
    startTransition(async () => {
      dispatch({ type: "setQuantity", variantId, quantity: next });
      bump(delta);
      await updateCartQuantity(variantId, next);
    });
  }

  function handleRemove(variantId: string, currentQuantity: number) {
    startTransition(async () => {
      dispatch({ type: "remove", variantId });
      bump(-currentQuantity);
      await removeFromCart(variantId);
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface px-4 py-10 mb-6 flex flex-col items-center text-center gap-3">
        <span aria-hidden className="text-3xl">
          🧺
        </span>
        <p className="text-sm text-muted">Your cart is empty.</p>
        <ButtonLink href="/shop" size="md">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <div className="rounded-card border border-border bg-surface px-4 mb-6">
        {items.map((item) => (
          <CartLineItem
            key={item.variantId}
            productName={item.productName}
            brand={item.brand}
            variantLabel={item.variantLabel}
            price={item.price}
            quantity={item.quantity}
            imageUrl={item.imageUrl}
            onQuantityChange={(next) => handleQuantityChange(item.variantId, item.quantity, next)}
            onRemove={() => handleRemove(item.variantId, item.quantity)}
          />
        ))}
      </div>

      <CheckoutForm subtotal={subtotal} />
    </>
  );
}
