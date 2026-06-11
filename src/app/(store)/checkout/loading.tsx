import { Skeleton } from "@/components/ui/SkeletonLoader";

/** Matches heritage checkout layout — avoids unrelated store skeleton flash. */
export default function CheckoutLoading() {
  return (
    <div className="min-h-[min(85vh,780px)] w-full bg-[#f8f9fa]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3">
          <Skeleton className="h-10 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="mb-8 hidden gap-10 border-b border-gray-200/70 pb-4 lg:flex">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="border border-gray-200/70 bg-white p-6 sm:p-8">
              <Skeleton className="mb-6 h-8 w-48" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
            <div className="border border-gray-200/70 bg-white p-6 sm:p-8">
              <Skeleton className="mb-6 h-8 w-44" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-4 border border-gray-200/70 bg-white p-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
