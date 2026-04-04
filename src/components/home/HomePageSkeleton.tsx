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
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-10">
      <div className="space-y-1 sm:space-y-2">
        <Skeleton className={`h-3 rounded-full sm:h-3.5 ${eyebrowW}`} />
        <Skeleton className={`h-8 rounded-lg sm:h-11 ${titleW}`} />
        {withDescription && (
          <>
            <Skeleton className="mt-2 hidden h-4 max-w-xl rounded-md sm:block" />
            <Skeleton className="mt-1 hidden h-4 max-w-lg rounded-md sm:block" />
          </>
        )}
      </div>
      <Skeleton className="hidden h-4 w-20 shrink-0 rounded-md sm:block" />
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
    <section className="bg-navy-900 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-14">
          <Skeleton className="mx-auto mb-3 h-3 w-36 rounded-full bg-navy-700" />
          <Skeleton className="mx-auto h-9 w-72 max-w-full rounded-lg bg-navy-700 sm:h-11" />
          <Skeleton className="mx-auto mt-4 h-0.5 w-16 rounded-full bg-brand-600/50" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-navy-700 bg-navy-800/80 p-5 sm:p-6"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-navy-700" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5 rounded-md bg-navy-700" />
                <Skeleton className="h-3 w-full rounded-md bg-navy-700/80" />
                <Skeleton className="h-3 w-4/5 rounded-md bg-navy-700/80" />
              </div>
            </div>
          ))}
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

      <section className="bg-gray-50 py-2 sm:py-6">
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

      <section className="bg-white py-10">
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

      <section className="bg-navy-950 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] border border-navy-700/50 bg-navy-900/40 p-8 sm:p-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="space-y-4">
                <Skeleton className="h-10 w-48 rounded-full bg-navy-700" />
                <Skeleton className="h-12 w-full max-w-md rounded-xl bg-navy-700 sm:h-16" />
                <Skeleton className="h-4 w-full max-w-lg rounded-md bg-navy-700/80" />
                <Skeleton className="h-4 max-w-md rounded-md bg-navy-700/80" />
                <Skeleton className="h-12 w-40 rounded-full bg-navy-700 sm:h-14 sm:w-48" />
              </div>
              <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-navy-800 lg:aspect-square lg:max-h-[320px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-14">
            <Skeleton className="mx-auto mb-3 h-3 w-28 rounded-full bg-navy-700" />
            <Skeleton className="mx-auto h-9 w-80 max-w-full rounded-lg bg-navy-700 sm:h-10" />
            <Skeleton className="mx-auto mt-4 h-0.5 w-16 rounded-full bg-brand-600/50" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-navy-700 bg-navy-900 p-6 sm:p-7"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton
                      key={j}
                      className="h-3.5 w-3.5 rounded-sm bg-navy-700"
                    />
                  ))}
                </div>
                <Skeleton className="mb-4 h-3 w-full rounded-md bg-navy-700/90" />
                <Skeleton className="mb-3 h-3 w-full rounded-md bg-navy-700/90" />
                <Skeleton className="mb-5 h-3 w-3/4 rounded-md bg-navy-700/80" />
                <div className="flex items-center gap-3 border-t border-navy-700 pt-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-navy-700" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24 rounded-md bg-navy-700" />
                    <Skeleton className="h-2.5 w-20 rounded-md bg-navy-700/80" />
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
