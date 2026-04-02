import { Skeleton } from "@/components/ui/SkeletonLoader";

export default function CartLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>
        <Skeleton className="hidden sm:block h-11 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white"
            >
              <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
                <div className="pt-2 flex gap-2">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
