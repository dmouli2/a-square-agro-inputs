import { Skeleton } from "@/components/ui/Skeleton";

/** Suspense fallback for HomeCatalogSections — roughly matches its real layout so the page
 *  doesn't jump around once the catalog data resolves. */
export function HomeCatalogSkeleton() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-end justify-between mb-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[72%] sm:w-[45%] md:w-[31%] lg:w-[23%] flex flex-col gap-2 rounded-card border border-border p-3.5">
              <Skeleton className="aspect-square rounded-control" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-full mt-1" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <Skeleton className="h-6 w-44 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </section>
    </>
  );
}
