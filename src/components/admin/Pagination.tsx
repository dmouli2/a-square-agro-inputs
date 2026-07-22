import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Base path, e.g. "/admin/products". Existing query params (other than page) are preserved. */
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

function hrefFor(basePath: string, searchParams: Record<string, string | undefined> | undefined, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(basePath, searchParams, page - 1)}
            className="rounded-control border border-border px-3 py-1.5 font-medium text-foreground hover:bg-primary-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-control border border-border px-3 py-1.5 font-medium text-muted opacity-50">Previous</span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(basePath, searchParams, page + 1)}
            className="rounded-control border border-border px-3 py-1.5 font-medium text-foreground hover:bg-primary-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-control border border-border px-3 py-1.5 font-medium text-muted opacity-50">Next</span>
        )}
      </div>
    </nav>
  );
}
