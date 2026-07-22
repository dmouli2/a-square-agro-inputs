import { ButtonLink } from "@/components/ui/Button";

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 pb-24 md:pb-16 flex flex-col items-center text-center gap-4">
      <span className="text-4xl">📦</span>
      <h1 className="font-display font-bold text-xl text-foreground">Order lookup coming soon</h1>
      <p className="text-sm text-muted max-w-xs">
        No account needed — once checkout is live, you&apos;ll be able to look up your orders
        here with just your phone number.
      </p>
      <ButtonLink href="/shop" size="lg" variant="secondary">
        Continue browsing
      </ButtonLink>
    </div>
  );
}
