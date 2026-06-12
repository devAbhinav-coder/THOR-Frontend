import { Skeleton } from "@/components/ui/SkeletonLoader";

export default function FeaturedProductCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col border-[3px] border-white bg-white">
      <Skeleton className="aspect-[3/4] w-full shrink-0 rounded-none border-0 bg-gray-100" />
      <div className="flex min-h-[8rem] flex-1 flex-col px-3 py-4 sm:min-h-[8.75rem] sm:px-4 sm:py-5">
        <Skeleton className="h-10 w-4/5 rounded-md sm:h-11" />
        <Skeleton className="mt-1 h-3 w-1/2 rounded-md" />
        <div className="mt-1.5 flex min-h-[1rem] gap-0.5 sm:mt-2 sm:min-h-[1.125rem]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3" />
          ))}
          <Skeleton className="ml-0.5 h-2.5 w-14 rounded-md" />
        </div>
        <Skeleton className="mt-auto h-4 w-20 rounded-md pt-1.5 sm:pt-2" />
      </div>
    </div>
  );
}
