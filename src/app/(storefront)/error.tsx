"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 pb-24 md:pb-20 flex flex-col items-center text-center gap-4">
      <span className="text-4xl">⚠️</span>
      <h1 className="font-display font-bold text-xl text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted max-w-xs">
        We hit a snag loading this page. Please try again, or head back to the shop.
      </p>
      <div className="flex gap-3">
        <Button size="lg" variant="secondary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/shop" size="lg">
          Back to shop
        </ButtonLink>
      </div>
    </div>
  );
}
