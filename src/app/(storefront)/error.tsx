"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { reportClientError } from "@/app/actions/errorLog";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
    reportClientError(error.message, error.stack, pathname).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
