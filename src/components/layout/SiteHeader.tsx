"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@/components/storefront/Logo";
import { SearchBar } from "@/components/storefront/SearchBar";
import { MobileHeaderSearch } from "./MobileHeaderSearch";

const SEARCH_PROMPTS = [
  "Search seeds…",
  "Search fertilizers…",
  "Search crop protection…",
  "Search farm tools…",
];

const NAV_LINKS = [
  { href: "/shop", label: "Shop", category: null },
  { href: "/shop?category=seeds", label: "Seeds", category: "seeds" },
  { href: "/shop?category=fertilizers", label: "Fertilizers", category: "fertilizers" },
  { href: "/shop?category=crop-protection", label: "Crop Protection", category: "crop-protection" },
] as const;

function isNavLinkActive(pathname: string, currentCategory: string | null, linkCategory: string | null) {
  if (pathname !== "/shop") return false;
  return linkCategory === null ? !currentCategory : currentCategory === linkCategory;
}

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const onCart = pathname === "/cart";

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        {/* Tablet/desktop (md+): logo, inline search bar, category nav, cart */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <Logo />

          <div className="flex-1 max-w-md">
            <SearchBar defaultValue={searchParams.get("q") ?? ""} animatedPhrases={SEARCH_PROMPTS} />
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium ml-auto">
            {NAV_LINKS.map((link) => {
              const active = isNavLinkActive(pathname, currentCategory, link.category);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`link-underline transition-colors ${
                    active
                      ? "text-primary-700 font-semibold [background-size:100%_1.5px]"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 ml-4">
            <Link
              href="/cart"
              aria-label="Cart"
              aria-current={onCart ? "page" : undefined}
              className={`relative flex h-10 w-10 items-center justify-center rounded-control transition-colors ${
                onCart
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-primary-50 text-foreground/80 hover:text-primary-700"
              }`}
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

        {/* Mobile (<md): logo + search icon + cart, expands to a search field in place */}
        <div className="flex md:hidden w-full">
          <MobileHeaderSearch cartCount={cartCount} />
        </div>
      </div>
    </header>
  );
}
