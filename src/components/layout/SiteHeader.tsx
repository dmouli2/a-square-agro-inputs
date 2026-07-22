import Link from "next/link";
import { Logo } from "@/components/storefront/Logo";
import { SearchBar } from "@/components/storefront/SearchBar";

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        <Logo />

        <div className="hidden md:block flex-1 max-w-md">
          <SearchBar />
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium ml-auto">
          <Link href="/shop" className="link-underline text-foreground/80 hover:text-foreground">
            Shop
          </Link>
          <Link href="/shop?category=seeds" className="link-underline text-foreground/80 hover:text-foreground">
            Seeds
          </Link>
          <Link href="/shop?category=fertilizers" className="link-underline text-foreground/80 hover:text-foreground">
            Fertilizers
          </Link>
          <Link href="/shop?category=crop-protection" className="link-underline text-foreground/80 hover:text-foreground">
            Crop Protection
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:ml-4 ml-auto">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-control hover:bg-primary-50 text-foreground/80 hover:text-primary-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3h2l.4 2M7 13h10l3.6-7.5H5.4M7 13L5.4 5.5M7 13l-1.5 3H18M9.5 20a1 1 0 100-2 1 1 0 000 2zM17.5 20a1 1 0 100-2 1 1 0 000 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-primary-900">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="md:hidden border-t border-border px-4 py-2.5">
        <SearchBar />
      </div>
    </header>
  );
}
