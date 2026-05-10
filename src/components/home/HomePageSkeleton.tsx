import HeroSectionSkeleton from "@/components/home/HeroSectionSkeleton";
import CategorySectionSkeleton from "@/components/home/CategorySectionSkeleton";
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
    <section className="bg-[#faf9f7] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-brand-50/80 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl flex-1 space-y-2 sm:space-y-3">
              <Skeleton className="h-3 w-40 rounded-full" />
              <Skeleton className="h-8 w-full max-w-md rounded-lg sm:h-10" />
              <Skeleton className="h-4 w-full max-w-lg rounded-md" />
              <Skeleton className="hidden h-4 max-w-md rounded-md sm:block" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-full rounded-2xl sm:w-44" />
              <Skeleton className="h-11 w-full rounded-2xl sm:w-36" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSkeleton() {
  return (
    <section className="bg-[#FAF9F6] py-16 md:py-24">
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

      <section className="bg-[#FAF9F6] py-2 sm:py-6">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <SectionHeaderSkeleton eyebrowW="w-36 sm:w-44" titleW="w-56 sm:w-80" />
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[130px] max-w-[130px] shrink-0 sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[260px] lg:max-w-[260px]"
              >
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center sm:mt-10 sm:hidden">
            <Skeleton className="h-12 w-56 rounded-lg" />
          </div>
        </div>
      </section>

      <PromoBannerSkeleton />

      <section className="bg-[#FAF9F6] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderSkeleton
            eyebrowW="w-28"
            titleW="w-64 sm:w-96"
            withDescription
          />
          <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 [&>*]:h-full [&>*]:min-h-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-8 flex justify-center sm:mt-10 sm:hidden">
            <Skeleton className="h-12 w-56 rounded-lg" />
          </div>
        </div>
      </section>

      <WhyChooseUsSkeleton />

      {/* HomeGiftShowcase Skeleton */}
      <section className="bg-[#FAF9F6] py-16 sm:py-24">
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
      <section className="bg-[#FAF9F6] py-16 sm:py-24">
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
