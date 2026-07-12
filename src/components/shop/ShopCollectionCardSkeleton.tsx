import { Skeleton } from "@/components/ui/SkeletonLoader";

export default function ShopCollectionCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col p-1 sm:p-1.5">
      <Skeleton className="mb-3 aspect-[3/4] w-full shrink-0 rounded-none bg-gray-100 sm:mb-4" />
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-[1.375rem] w-4/5 rounded-md sm:h-[1.5625rem]" />
        <Skeleton className="mt-0.5 h-3 w-1/2 rounded-md" />
        <div className="mt-1 flex gap-0.5 sm:mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3" />
          ))}
          <Skeleton className="ml-0.5 h-2.5 w-14 rounded-md" />
        </div>
        <Skeleton className="mt-auto h-4 w-20 rounded-md pt-1 sm:pt-1.5" />
      </div>
    </div>
  );
}
