import { Skeleton } from "@/components/ui/Skeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 md:pb-8">
      <Skeleton className="h-8 w-32 mb-6" />

      <div className="rounded-card border border-border bg-surface px-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5 border-b border-border last:border-0">
            <Skeleton className="h-14 w-14 shrink-0 rounded-control" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-control" />
          </div>
        ))}
      </div>

      <Skeleton className="h-16 w-full rounded-card mb-6" />
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}
