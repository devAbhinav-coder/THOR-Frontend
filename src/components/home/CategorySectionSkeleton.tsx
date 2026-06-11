import { Skeleton } from "@/components/ui/SkeletonLoader";

const CARD_CLASS =
  "w-[78vw] shrink-0 sm:w-[300px] lg:w-[calc((100%-3rem)/4)] lg:max-w-[300px]";

export default function CategorySectionSkeleton() {
  return (
    <section className="bg-white py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center gap-4 px-1 sm:mb-10 lg:flex-row lg:items-end lg:justify-between lg:px-0">
          <div className="text-center lg:text-left">
            <Skeleton className="mx-auto h-3 w-36 rounded-full lg:mx-0 sm:h-3.5" />
            <Skeleton className="mx-auto mt-4 h-8 w-56 rounded-lg lg:mx-0 sm:h-12 sm:w-72" />
          </div>
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>

        <div className="flex gap-3 overflow-x-hidden pb-1 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={CARD_CLASS}>
              <div className="border border-[#c5a059]/30 bg-white p-2">
                <div
                  className="relative overflow-hidden bg-gray-100"
                  style={{ aspectRatio: "3/4" }}
                >
                  <Skeleton className="absolute inset-0 rounded-none border-0" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center sm:pb-5">
                    <Skeleton className="mx-auto h-3 w-2/3 rounded-md bg-white/50" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
