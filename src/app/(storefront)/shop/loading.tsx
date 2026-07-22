import { Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      <Skeleton className="h-11 w-full mb-5 rounded-control" />
      <Skeleton className="h-8 w-48 mb-6" />

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-card border border-border p-3.5">
            <Skeleton className="aspect-square rounded-control" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
