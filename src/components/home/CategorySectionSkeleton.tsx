import { Skeleton } from "@/components/ui/SkeletonLoader";

const CARD_CLASS =
  "w-[clamp(104px,28vw,150px)] shrink-0 snap-start md:w-[160px] lg:w-[180px] xl:w-[200px] 2xl:w-[215px]";

export default function CategorySectionSkeleton() {
  return (
    <section className="bg-[#f9f9f9] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-center text-center sm:mb-16">
          <Skeleton className="h-8 w-56 rounded-lg sm:h-10 sm:w-72" />
        </div>

        <div className="overflow-x-hidden pb-1">
          <div className="mx-auto flex w-max flex-nowrap gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={CARD_CLASS}>
                <div
                  className="relative overflow-hidden bg-gray-100"
                  style={{ aspectRatio: "3/4" }}
                >
                  <Skeleton className="absolute inset-0 rounded-none border-0" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 px-2 pb-4 lg:pb-5">
                    <Skeleton className="mx-auto h-3 w-2/3 rounded-md bg-white/50 lg:h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
