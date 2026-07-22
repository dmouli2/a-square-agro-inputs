import { ButtonLink } from "@/components/ui/Button";

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 pb-24 md:pb-20 flex flex-col items-center text-center gap-4">
      <span className="text-4xl">🌾</span>
      <h1 className="font-display font-bold text-xl text-foreground">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted max-w-xs">
        It may have been moved or the link might be out of date. Let&apos;s get you back to
        shopping.
      </p>
      <ButtonLink href="/shop" size="lg">
        Browse products
      </ButtonLink>
    </div>
  );
}
