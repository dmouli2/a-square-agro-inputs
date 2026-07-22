"use client";

import { useEffect, useRef } from "react";
import { removeManyFromCart } from "@/app/actions/cart";

/**
 * Silently prunes cart cookie entries that no longer resolve to a real
 * product/variant (e.g. a stale id left over from before this browser's cart
 * was populated against the current database) — otherwise the header's cart
 * count keeps including phantom items the cart page can't display.
 */
export function CartCleanup({ staleVariantIds }: { staleVariantIds: string[] }) {
  const cleaned = useRef(false);

  useEffect(() => {
    if (cleaned.current || staleVariantIds.length === 0) return;
    cleaned.current = true;
    removeManyFromCart(staleVariantIds);
  }, [staleVariantIds]);

  return null;
}
