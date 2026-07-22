import { Logo } from "@/components/storefront/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function RootNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <Logo />
      <span className="text-4xl">🌾</span>
      <h1 className="font-display font-bold text-xl text-foreground">Page not found</h1>
      <p className="text-sm text-muted max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <ButtonLink href="/" size="lg">
        Go home
      </ButtonLink>
    </div>
  );
}
