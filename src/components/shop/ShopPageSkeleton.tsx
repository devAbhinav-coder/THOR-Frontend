import { Skeleton } from "@/components/ui/SkeletonLoader";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";

export default function ShopPageSkeleton() {
  return (
    <div className="bg-white pb-12 pt-6 sm:pt-8 lg:pb-16 lg:pt-10">
      <section className="mb-6 px-4 sm:mb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-8 w-2/3 max-w-sm rounded-md sm:h-9" />
        </div>
      </section>

      <div className="mb-10 border-y border-gray-100 sm:mb-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 items-stretch gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 [&>*]:h-full [&>*]:min-h-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShopCollectionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
