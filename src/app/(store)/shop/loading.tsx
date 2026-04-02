import { ProductCardSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-72 shrink-0 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
          <div className="pt-2 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </aside>

        <div className="flex-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Skeleton className="h-11 w-full sm:max-w-md rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl hidden sm:block" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
