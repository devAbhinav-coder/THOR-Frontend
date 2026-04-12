import { ProductCardSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";

/** Matches `GiftingPageClient` hero height + strip + product grid (route transition). */
export default function GiftingLoading() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative">
        <div className="relative h-[176px] sm:h-[240px] lg:h-[280px] overflow-hidden bg-gray-100">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-xl space-y-3">
              <Skeleton className="h-7 sm:h-10 w-72 sm:w-[28rem] bg-white/25" />
              <Skeleton className="h-4 w-80 bg-white/20" />
              <Skeleton className="h-4 w-64 bg-white/15" />
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-1">
        <Skeleton className="h-3 w-28 rounded-full mb-2" />
        <Skeleton className="h-8 w-64 max-w-full rounded-lg sm:h-9" />
      </section>
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3">
        <div className="flex items-start gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-shrink-0 flex-col items-center w-[84px] sm:w-[92px]"
            >
              <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-gray-100" />
              <Skeleton className="mt-2 h-3 w-16 shrink-0 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="relative h-[110px] sm:h-[140px] rounded-2xl overflow-hidden border border-gray-100 bg-gray-100"
            >
              <Skeleton className="absolute inset-0" />
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
