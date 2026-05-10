import { Skeleton } from "@/components/ui/SkeletonLoader";

const CARD_CLASS =
  "w-[270px] shrink-0 sm:w-[330px] lg:w-[370px]";

/** Matches `CategorySection` header + swiper cards. */
export default function CategorySectionSkeleton() {
  return (
    <section className="bg-[#FAF9F6] py-12 sm:py-14">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Centered Header matching real component */}
        <div className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-12 bg-gray-200 sm:w-16" />
            <Skeleton className="h-3 w-32 rounded-full sm:h-3.5" />
            <span className="h-px w-12 bg-gray-200 sm:w-16" />
          </div>
          <Skeleton className="mt-4 h-8 w-64 rounded-lg sm:h-12 sm:w-96" />
        </div>

        {/* Card Row */}
        <div className="flex gap-4 overflow-x-hidden pb-1 px-2 sm:px-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={CARD_CLASS}>
              <div
                className="relative overflow-hidden rounded-2xl bg-[#f0ebe4]"
                style={{ aspectRatio: "3/4" }}
              >
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4 sm:p-5">
                  <Skeleton className="h-6 w-3/4 rounded-md bg-white/50" />
                  <Skeleton className="h-3 w-1/3 rounded-md bg-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
