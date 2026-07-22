export const PAGE_SIZE = 20;

export interface PageResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

/** Clamps a raw ?page= value to a valid 1-based page number for the given item count. */
export function parsePage(raw: string | undefined, totalItems: number, pageSize: number = PAGE_SIZE): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, totalPages);
}

/** Slices `items` to the requested page. `page` is expected to already be clamped via parsePage. */
export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE): PageResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    totalPages,
    totalItems,
  };
}
