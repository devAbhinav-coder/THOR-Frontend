import { Skeleton } from "@/components/ui/SkeletonLoader";

/** Matches `HeroSection` height, text stack, CTAs, and carousel dots (mobile + desktop). */
export default function HeroSectionSkeleton() {
  return (
    <section className="relative h-[min(42svh,320px)] sm:h-[min(80svh,700px)] overflow-hidden bg-navy-950">
      <div className="absolute inset-0">
        <Skeleton className="h-full w-full rounded-none border-0 bg-navy-800/90" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      <div className="relative flex h-full max-w-7xl mx-auto items-center px-3 pt-3 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-1.5 sm:space-y-3">
          <Skeleton className="h-5 w-28 rounded-full bg-white/20 sm:h-6 sm:w-36" />
          <Skeleton className="h-3 w-36 rounded-full bg-white/25 sm:h-5 sm:w-56" />
          <Skeleton className="h-8 w-[min(100%,280px)] max-w-sm rounded-lg bg-white/25 sm:h-14 sm:max-w-xl sm:rounded-xl" />
          <Skeleton className="hidden h-10 max-w-lg rounded-lg bg-white/20 sm:block sm:h-16 sm:rounded-xl" />
          <Skeleton className="hidden h-4 max-w-md rounded-md bg-white/15 sm:block" />
          <Skeleton className="hidden h-4 max-w-sm rounded-md bg-white/12 sm:block" />
          <div className="flex flex-wrap gap-1.5 pt-0.5 sm:gap-3 sm:pt-2">
            <Skeleton className="h-8 w-[108px] rounded-md bg-brand-500/35 sm:h-12 sm:w-44 sm:rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-md bg-white/25 sm:h-12 sm:w-36 sm:rounded-xl" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6">
        <Skeleton className="h-2 w-8 rounded-full bg-white/35" />
        <Skeleton className="h-2 w-2 rounded-full bg-white/25" />
        <Skeleton className="h-2 w-2 rounded-full bg-white/25" />
      </div>
    </section>
  );
}
