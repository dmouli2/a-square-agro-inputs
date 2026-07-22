import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      <Skeleton className="h-3 w-40 mb-6" />

      <div className="grid md:grid-cols-2 gap-10">
        <Skeleton className="aspect-square rounded-card" />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-3/4" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-14 w-full rounded-control" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
