const SEARCH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function SearchBar({ defaultValue = "", placeholder = "Search seeds, fertilizers, sprayers…", size = "sm", className = "" }: SearchBarProps) {
  const height = size === "lg" ? "h-14" : "h-11";
  const textSize = size === "lg" ? "text-base" : "text-sm";

  return (
    <form action="/shop" method="GET" role="search" className={`relative w-full ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
        {SEARCH_ICON}
      </span>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label="Search products"
        className={`w-full ${height} ${textSize} rounded-control border border-border bg-surface pl-11 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-shadow`}
      />
    </form>
  );
}
