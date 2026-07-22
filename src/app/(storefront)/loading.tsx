import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="pb-8 md:pb-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 flex flex-col gap-5 md:max-w-xl">
          <Skeleton className="h-6 w-56 bg-white/15" />
          <Skeleton className="h-10 w-full bg-white/15" />
          <Skeleton className="h-10 w-3/4 bg-white/15" />
          <Skeleton className="h-14 w-full max-w-md bg-white/15 rounded-control" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-12 w-32 bg-white/15" />
            <Skeleton className="h-12 w-36 bg-white/15" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-end justify-between mb-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-card border border-border p-3.5">
              <Skeleton className="aspect-square rounded-control" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-56 w-full rounded-card" />
      </section>
    </div>
  );
}
