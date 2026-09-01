import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/SkeletonLoader";

/** Mirrors `ProductDetailClient` wrapper — avoids mobile tab-bar layout jump when content swaps in. */
const mobileBottomReserve =
  "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-8";

/**
 * Full product detail placeholder: single main image, info column, story grid, reviews band.
 */
export function ProductDetailSkeleton() {
  return (
    <div
      className={`bg-white min-h-screen max-w-full overflow-x-hidden ${mobileBottomReserve}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs"
          aria-hidden
        >
          <Skeleton className="h-3 w-10 rounded-full" />
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-200" />
          <Skeleton className="h-3 w-9 rounded-full" />
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-200" />
          <Skeleton className="h-3 w-16 rounded-full" />
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-200" />
          <Skeleton className="h-3 w-28 max-w-[min(180px,45vw)] rounded-full" />
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-6 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 xl:gap-10 min-w-0">
          <div className="min-w-0">
            <div className="relative flex min-w-0 gap-3 lg:gap-5">
              <div className="hidden w-14 flex-shrink-0 flex-col gap-2 lg:flex">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[3/4] w-full rounded-sm border border-gray-100"
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="hidden gap-2 md:flex lg:hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="aspect-[3/4] w-14 shrink-0 rounded-sm border border-gray-100"
                    />
                  ))}
                </div>
                <div className="border border-[#c5a059]/40 bg-white p-2 sm:p-2.5">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 ring-1 ring-[#c5a059]/20">
                    <Skeleton className="absolute inset-0 border-0 rounded-none" />
                    <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col gap-2">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full shadow-sm" />
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full shadow-sm" />
                    </div>
                    <Skeleton className="pointer-events-none absolute bottom-3 left-1/2 h-6 w-12 -translate-x-1/2 rounded-full md:hidden" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-8 w-full max-w-xl rounded-lg sm:h-10" />
              <Skeleton className="h-8 w-4/5 max-w-lg rounded-lg sm:h-9" />
              <Skeleton className="h-4 w-full max-w-md rounded-md" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded-sm" />
                ))}
              </div>
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>

            <div className="space-y-2 rounded-2xl bg-gray-50 p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <Skeleton className="h-9 w-32 rounded-md sm:h-10 sm:w-36" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-48 max-w-full rounded-md" />
            </div>

            <div>
              <Skeleton className="mb-2 h-4 w-36 rounded-md" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-12 rounded-xl sm:h-11 sm:w-14"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Skeleton className="mb-2 h-3 w-16 rounded-md" />
                <Skeleton className="h-11 w-[8.5rem] rounded-xl" />
              </div>
            </div>

            <div className="hidden flex-col gap-3 pt-2 lg:flex">
              <Skeleton className="h-[3.25rem] w-full rounded-none" />
              <Skeleton className="h-[3.25rem] w-full rounded-none" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 border-t border-gray-100 pt-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 rounded-sm border border-[#c5a059]/20 bg-[#faf8f4] px-2 py-3"
                >
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="hidden h-2.5 w-12 rounded-md sm:block" />
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 border border-gray-100 bg-gray-50/80 px-4 py-3">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-[94%] max-w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="border border-gray-200 bg-white lg:col-span-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-gray-200 px-4 py-4 last:border-b-0 sm:px-5"
              >
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                <Skeleton className="h-3 flex-1 max-w-[140px] rounded-md" />
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
              </div>
            ))}
          </div>

          <div className="border border-[#c5a059]/25 bg-[#faf8f4] px-5 py-6 lg:col-span-4">
            <Skeleton className="h-6 w-40 rounded-md" />
            <div className="mt-5 space-y-3.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
                  <Skeleton className="h-3 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden border border-gray-200 bg-gray-100 lg:col-span-4">
            <Skeleton className="absolute inset-0 border-0 rounded-none" />
            <Skeleton className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          </div>
        </div>
      </div>

      <section className="bg-[#faf9f7] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-36 rounded-full" />
              <Skeleton className="h-9 w-64 max-w-full rounded-lg sm:h-11 sm:w-80" />
            </div>
            <Skeleton className="h-11 w-full rounded-2xl sm:h-12 sm:w-48" />
          </div>

          <div className="mb-8 grid gap-4 sm:mb-10 lg:grid-cols-12 lg:gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-4">
              <Skeleton className="mx-auto mb-3 h-16 w-16 rounded-full sm:h-20 sm:w-20" />
              <Skeleton className="mx-auto mb-2 h-6 w-24 rounded-md" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-2 w-8 rounded-full" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 lg:col-span-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-7 w-14 rounded-lg" />
                  </div>
                  <Skeleton className="mt-3 h-3 w-full rounded-md" />
                  <Skeleton className="mt-2 h-3 w-full rounded-md" />
                  <Skeleton className="mt-2 h-3 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
