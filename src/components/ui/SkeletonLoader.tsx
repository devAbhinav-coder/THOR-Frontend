import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton rounded-md', className)} />
  );
}

/** Matches `ProductCard`: 3:4 image (shimmer while “photo” loads) + meta/title/swatches/stars/price + mobile CTA. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col justify-start sm:min-h-[460px]">
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100">
        <Skeleton className="h-full w-full rounded-2xl border-0" />
      </div>
      <div className="mt-2 flex min-h-0 flex-none flex-col gap-0.5 sm:mt-3 sm:flex-1 sm:gap-1">
        <div className="flex h-4 min-h-4 shrink-0 items-center gap-1">
          <Skeleton className="h-2.5 w-14 shrink-0 rounded-full sm:h-3 sm:w-20" />
          <Skeleton className="hidden h-2 w-10 shrink-0 rounded-full sm:block" />
        </div>
        <div className="min-h-8 space-y-1">
          <Skeleton className="h-3.5 w-full rounded-md sm:h-4" />
          <Skeleton className="h-3.5 w-4/5 rounded-md sm:h-4" />
        </div>
        <div className="flex h-3 min-h-3 shrink-0 items-center gap-1 sm:h-5 sm:min-h-5">
          <Skeleton className="h-2 w-2 rounded-full sm:h-3.5 sm:w-3.5" />
          <Skeleton className="h-2 w-2 rounded-full sm:h-3.5 sm:w-3.5" />
          <Skeleton className="h-2 w-2 rounded-full sm:h-3.5 sm:w-3.5" />
        </div>
        <div className="flex h-2 min-h-2 shrink-0 items-center gap-0.5 sm:h-4 sm:min-h-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3"
            />
          ))}
          <Skeleton className="ml-0.5 h-2 w-6 rounded sm:h-2.5 sm:w-8" />
        </div>
        <div className="flex min-h-[26px] shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <Skeleton className="h-5 w-20 rounded-md sm:h-6 sm:w-24" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
        <div className="min-h-0 flex-1 sm:flex-none" aria-hidden />
      </div>
      <div className="mt-auto shrink-0 pt-2 sm:hidden">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}
