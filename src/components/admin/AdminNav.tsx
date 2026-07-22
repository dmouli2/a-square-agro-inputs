"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/products", label: "Products", icon: "🌾", exact: false },
  { href: "/admin/categories", label: "Categories", icon: "🗂️", exact: false },
  { href: "/admin/orders", label: "Orders", icon: "📦", exact: false },
  { href: "/admin/customers", label: "Customers", icon: "👥", exact: false },
  { href: "/admin/errors", label: "Errors", icon: "🛠️", exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:shrink-0 border-r border-border bg-surface">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-display font-extrabold text-sm text-foreground">A Square Admin</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(pathname, item.href, item.exact)
                ? "bg-primary-700 text-white"
                : "text-foreground/80 hover:bg-primary-50"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border flex flex-col gap-2">
        <span className="px-3 text-xs text-muted truncate">{staffName}</span>
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left rounded-control px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-primary-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, item.href, item.exact)
                ? "bg-primary-700 text-white"
                : "text-foreground/80 bg-primary-50"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto shrink-0">
          <button type="submit" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
