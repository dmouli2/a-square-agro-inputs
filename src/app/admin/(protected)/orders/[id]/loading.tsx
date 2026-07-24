import { Skeleton } from "@/components/ui/Skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="h-16 rounded-card" />

      <div className="rounded-card border border-border bg-surface px-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>

      <Skeleton className="h-20 rounded-card" />
      <Skeleton className="h-28 rounded-card" />
    </div>
  );
}
