import HeroSectionSkeleton from "@/components/home/HeroSectionSkeleton";
import CategorySectionSkeleton from "@/components/home/CategorySectionSkeleton";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";

function SectionHeaderSkeleton({
  eyebrowW,
  titleW,
  withDescription,
}: {
  eyebrowW: string;
  titleW: string;
  withDescription?: boolean;
}) {
  return (
    <div className="mb-6 sm:mb-10 text-center flex flex-col items-center">
      <div className="inline-flex items-center gap-3">
        <span className="h-px w-12 bg-gray-200 sm:w-16" />
        <Skeleton className={`h-3 rounded-full sm:h-3.5 ${eyebrowW}`} />
        <span className="h-px w-12 bg-gray-200 sm:w-16" />
      </div>
      <Skeleton className={`mt-4 h-8 rounded-lg sm:h-12 ${titleW}`} />
      {withDescription && (
        <div className="mt-3 flex flex-col items-center gap-2 w-full">
          <Skeleton className="h-4 max-w-xl w-full rounded-md" />
          <Skeleton className="hidden h-4 max-w-lg w-full rounded-md sm:block" />
        </div>
      )}
    </div>
  );
}

function PromoBannerSkeleton() {
  return (
    <section className="bg-white">
      <Skeleton className="min-h-[420px] w-full rounded-none border-0 sm:min-h-[460px] lg:min-h-[520px]" />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-8 lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="w-full lg:w-auto">
            <Skeleton className="mx-auto h-3 w-28 rounded-full lg:mx-0" />
            <Skeleton className="mx-auto mt-3 h-8 w-56 rounded-lg lg:mx-0 sm:h-10 sm:w-72" />
            <Skeleton className="mx-auto mt-2 h-4 w-full max-w-md rounded-md lg:mx-0" />
          </div>
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>

      <div className="flex gap-3 overflow-hidden px-4 pb-1 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[78vw] shrink-0 border border-[#c5a059]/30 bg-white p-2 sm:w-[300px]">
            <Skeleton className="aspect-[3/4] w-full rounded-none border-0" />
          </div>
        ))}
      </div>

      <div className="mx-auto hidden max-w-7xl gap-3 px-4 pb-2 sm:px-6 md:grid md:grid-cols-2 lg:gap-4 lg:px-8">
        <div className="border border-[#c5a059]/30 bg-white p-2.5">
          <Skeleton className="min-h-[300px] rounded-none border-0 lg:min-h-[380px]" />
        </div>
        <div className="grid min-h-[300px] grid-cols-2 gap-3 lg:min-h-[380px] lg:gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-[#c5a059]/30 bg-white p-2.5">
              <Skeleton className="h-full min-h-[140px] rounded-none border-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <Skeleton className="mx-auto h-3 w-36 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-9 w-64 rounded-lg sm:h-10 sm:w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[#c5a059]/30 bg-white px-6 py-6 sm:px-7 sm:py-7">
              <Skeleton className="mb-4 h-2.5 w-8 rounded-full" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="mt-3 h-4 w-full rounded-md" />
              <Skeleton className="mt-2 h-4 w-5/6 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSkeleton() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Full-width Centered Header */}
        <div className="mb-12 lg:mb-16 w-full text-center flex flex-col items-center">
          <Skeleton className="mb-2 h-3 w-32 rounded-full sm:h-3.5 sm:w-48" />
          <Skeleton className="h-10 w-64 rounded-lg sm:h-12 sm:w-96 lg:h-14 lg:w-[500px]" />
          <Skeleton className="mt-5 h-1 w-20 rounded-full lg:mt-6 lg:w-28" />
        </div>

        <div className="flex flex-col items-start gap-10 md:flex-row lg:gap-16">
          {/* Left Side: Sticky Image (30% width) */}
          <div className="z-10 flex w-full flex-col items-center md:w-4/12 lg:w-4/12">
            <Skeleton className="aspect-[3/4] w-full max-w-[280px] rounded-2xl sm:max-w-[340px] md:max-w-full" />
          </div>

          {/* Right Side: Scrolling Cards Grid (70% width) */}
          <div className="mt-1 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-8/12 lg:w-8/12 lg:gap-4 lg:mt-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex w-full flex-row items-center gap-3 overflow-hidden rounded-2xl border border-white bg-white/80 p-4 shadow-sm lg:gap-4 lg:p-5"
              >
                <Skeleton className="z-10 h-12 w-12 shrink-0 rounded-xl lg:h-14 lg:w-14" />
                <div className="z-10 flex min-w-0 flex-1 flex-col space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md lg:h-5" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-5/6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Full home layout mirror for `/(home)/loading` and quick visual parity checks. */
export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSectionSkeleton />
      <CategorySectionSkeleton />

      <section className="bg-[#000d21] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 sm:mb-14">
            <Skeleton className="h-3 w-36 rounded-full bg-white/10" />
            <Skeleton className="mt-4 h-10 w-64 rounded-lg bg-white/10 sm:h-12 sm:w-80" />
          </div>
          <div className="flex gap-3 overflow-hidden pb-1 sm:gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[calc(50%-0.375rem)] shrink-0 sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.9375rem)] flex h-full flex-col border-[3px] border-white bg-white">
                <Skeleton className="aspect-square w-full rounded-none border-0 bg-gray-100" />
                <div className="flex flex-col items-center px-3 py-4">
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="mt-2 h-2.5 w-2/3 rounded-md" />
                  <Skeleton className="mt-3 h-4 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PromoBannerSkeleton />

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <Skeleton className="mx-auto h-3 w-24 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-10 w-64 rounded-lg sm:h-12 sm:w-80" />
            <Skeleton className="mx-auto mt-4 h-4 w-full max-w-xl rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCollectionCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="mx-auto mt-10 h-14 w-full max-w-sm rounded-none" />
        </div>
      </section>

      <WhyChooseUsSkeleton />

      {/* HomeGiftShowcase Skeleton */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
            
            {/* Left Side: Sticky Title */}
            <div className="w-full text-center md:w-5/12 md:text-left">
              <Skeleton className="mx-auto mb-3 h-3 w-32 rounded-full md:mx-0 sm:h-4 sm:w-40" />
              <Skeleton className="mx-auto mb-6 h-12 w-64 rounded-lg md:mx-0 sm:h-16 sm:w-80" />
              <Skeleton className="mx-auto h-4 w-full max-w-md rounded-md md:mx-0" />
              <Skeleton className="mx-auto mt-2 h-4 w-5/6 max-w-md rounded-md md:mx-0" />
            </div>

            {/* Right Side: Stacked Cards */}
            <div className="w-full md:w-6/12">
              <div className="relative w-full pb-[150%] sm:pb-[100%] md:pb-[130%] lg:pb-[100%]">
                <Skeleton className="absolute left-0 top-0 h-[380px] w-full rounded-[2.5rem] border border-white bg-white/60 shadow-sm" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials Skeleton */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-14">
            <Skeleton className="mx-auto mb-3 h-3 w-28 rounded-full" />
            <Skeleton className="mx-auto h-9 w-80 max-w-full rounded-lg sm:h-12 sm:w-96" />
            <Skeleton className="mx-auto mt-6 h-1 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col rounded-[2rem] border border-white/80 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="mb-6 flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-4 rounded-sm" />
                  ))}
                </div>
                <div className="mb-8 flex-grow space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <div className="flex items-center gap-4 border-t border-gray-100/80 pt-6">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
