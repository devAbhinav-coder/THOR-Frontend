import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/SkeletonLoader";

/** Mirrors `ProductDetailClient` wrapper — avoids mobile tab-bar layout jump when content swaps in. */
const mobileBottomReserve =
  "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8";

/**
 * Full product detail placeholder: gallery (3:4 + thumbs), info column, tabs, reviews band.
 * Keeps the same max-width, grid, and aspect ratios as the loaded PDP for minimal CLS.
 */
export function ProductDetailSkeleton() {
  return (
    <div
      className={`bg-white min-h-screen max-w-full overflow-x-hidden ${mobileBottomReserve}`}
    >
      {/* Breadcrumb — same shell as live PDP */}
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

      {/* HERO — gallery + info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-6 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 xl:gap-10 min-w-0">
          {/* Gallery */}
          <div className="relative flex gap-3.5 lg:gap-5 min-w-0 overflow-x-hidden lg:overflow-visible">
            <div className="hidden lg:flex flex-col gap-2 w-[88px] flex-shrink-0 overflow-y-auto scrollbar-hide">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] w-full overflow-hidden rounded-xl"
                >
                  <Skeleton className="h-full w-full rounded-xl border-0" />
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-50">
                <Skeleton className="absolute inset-0 rounded-2xl border-0" />
                <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col gap-2">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full shadow-sm" />
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full shadow-sm" />
                </div>
              </div>

              <div className="flex w-full min-w-0 gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg"
                  >
                    <Skeleton className="h-full w-full rounded-lg border-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product info */}
          <div className="min-w-0 space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-8 w-full max-w-xl rounded-lg sm:h-10" />
              <Skeleton className="h-8 w-4/5 max-w-lg rounded-lg sm:h-9" />
              <Skeleton className="h-4 w-full max-w-md rounded-md" />
              <Skeleton className="h-4 w-3/5 max-w-sm rounded-md" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded-sm" />
                ))}
              </div>
              <Skeleton className="h-4 w-8 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>

            <div className="space-y-2 rounded-2xl bg-gray-50 p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <Skeleton className="h-9 w-32 rounded-md sm:h-10 sm:w-36" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-48 max-w-full rounded-md" />
              <Skeleton className="h-3 w-full max-w-sm rounded-md" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-12 rounded-xl sm:h-11 sm:w-14"
                  />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="mb-2 h-4 w-32 rounded-md" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-24 rounded-xl sm:w-28"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Skeleton className="mb-2 h-3 w-16 rounded-md" />
                <Skeleton className="h-11 w-[8.5rem] rounded-xl" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:pt-4">
              <div className="flex min-w-0 gap-3">
                <Skeleton className="h-[3.25rem] flex-1 rounded-2xl" />
                <Skeleton className="h-[3.25rem] flex-1 rounded-2xl" />
              </div>
              <Skeleton className="h-[3.25rem] w-full rounded-2xl" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-navy-100 bg-navy-50 p-3 text-center"
                >
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-3 w-14 rounded-md" />
                  <Skeleton className="h-2.5 w-12 rounded-md" />
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3.5">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-[94%] max-w-full rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md sm:hidden" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Description / details tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <div className="flex border-b border-gray-100 bg-gray-50/60">
            <div className="flex flex-1 justify-center px-4 py-4 sm:flex-none sm:justify-start sm:px-6">
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <div className="flex flex-1 justify-center px-4 py-4 sm:flex-none sm:justify-start sm:px-6">
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
          <div className="space-y-3 p-6 sm:p-8">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-[92%] max-w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="hidden h-4 w-4/5 rounded-md sm:block" />
          </div>
        </div>
      </div>

      {/* Reviews band */}
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
              <Skeleton className="mx-auto h-3 w-32 rounded-md" />
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
