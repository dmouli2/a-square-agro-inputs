"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠", exact: true },
  { href: "/shop", label: "Shop", icon: "🛒", exact: true },
  { href: "/cart", label: "Cart", icon: "🧺", exact: true },
  { href: "/orders", label: "Orders", icon: "📦", exact: false },
] as const;

function isTabActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors flex-1 h-full ${
                active ? "text-primary-700" : "text-muted hover:text-primary-700"
              }`}
            >
              <span
                className={`relative flex items-center justify-center text-lg leading-none rounded-full transition-colors ${
                  active ? "h-8 w-8 bg-primary-50" : "h-8 w-8"
                }`}
              >
                {tab.icon}
                {tab.href === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-primary-900">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
