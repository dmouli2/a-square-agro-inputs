"use client";

import { useEffect } from "react";
import { Logo } from "@/components/storefront/Logo";
import { Button } from "@/components/ui/Button";

export default function RootError({
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
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <Logo />
      <span className="text-4xl">⚠️</span>
      <h1 className="font-display font-bold text-xl text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted max-w-xs">Please try again in a moment.</p>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
