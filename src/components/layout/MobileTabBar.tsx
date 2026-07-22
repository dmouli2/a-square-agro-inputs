import Link from "next/link";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/shop", label: "Shop", icon: "🛒" },
  { href: "/cart", label: "Cart", icon: "🧺" },
  { href: "/orders", label: "Orders", icon: "📦" },
];

export function MobileTabBar({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center gap-0.5 text-muted hover:text-primary-700 transition-colors flex-1 h-full"
          >
            <span className="relative text-lg leading-none">
              {tab.icon}
              {tab.href === "/cart" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-primary-900">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
