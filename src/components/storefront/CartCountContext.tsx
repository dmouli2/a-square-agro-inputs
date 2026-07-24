"use client";

import { createContext, useContext, useEffect, useOptimistic, useState, type ReactNode } from "react";

interface CartCountContextValue {
  /** Reflects pending mutations immediately — callers wrap `bump` in the same transition as
   *  the Server Action that actually persists the change, so the header/tab-bar badge doesn't
   *  wait for a full round trip + revalidation before it looks right. */
  count: number;
  bump: (delta: number) => void;
}

const CartCountContext = createContext<CartCountContextValue | null>(null);

/** Wraps the storefront layout so the cart badge (header + mobile tab bar) can be updated
 *  optimistically from anywhere a cart mutation happens (product cards, the cart page) without
 *  prop-drilling a setter through every layer. Reconciles back to the real count once the
 *  server round trip that triggered the bump actually lands (`initialCount` changes after
 *  `revalidatePath` re-runs the layout). */
export function CartCountProvider({ initialCount, children }: { initialCount: number; children: ReactNode }) {
  const [baseCount, setBaseCount] = useState(initialCount);
  useEffect(() => {
    // Resyncing to the server's fresh count after a revalidation — there's no external system
    // to synchronize against here, just adopting the new prop once the layout re-renders it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBaseCount(initialCount);
  }, [initialCount]);

  const [optimisticCount, bump] = useOptimistic(baseCount, (state, delta: number) => Math.max(0, state + delta));

  return <CartCountContext.Provider value={{ count: optimisticCount, bump }}>{children}</CartCountContext.Provider>;
}

export function useCartCount(): CartCountContextValue {
  const ctx = useContext(CartCountContext);
  if (!ctx) throw new Error("useCartCount must be used within a CartCountProvider");
  return ctx;
}
