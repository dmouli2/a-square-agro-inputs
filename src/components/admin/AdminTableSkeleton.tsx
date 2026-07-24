import { Skeleton } from "@/components/ui/Skeleton";

export function AdminTableSkeleton({
  title,
  columns,
  rows = 8,
  withSearch = false,
}: {
  title: string;
  columns: number;
  rows?: number;
  withSearch?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">{title}</h1>
      {withSearch && <Skeleton className="h-10 w-full max-w-sm rounded-control" />}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <div className="flex gap-6 border-b border-border px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border px-4 py-3.5 last:border-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
