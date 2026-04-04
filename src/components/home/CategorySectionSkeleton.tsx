import { Skeleton } from "@/components/ui/SkeletonLoader";

const CARD_CLASS =
  "w-[150px] shrink-0 sm:w-[160px] lg:w-[200px]";

/** Matches `CategorySection` header + horizontal strip + 3/4 cards with bottom title bands. */
export default function CategorySectionSkeleton() {
  return (
    <section className="bg-[#faf9f7] py-6 sm:py-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-32 rounded-full sm:h-3.5 sm:w-40" />
            <Skeleton className="h-7 w-52 rounded-lg sm:h-10 sm:w-72" />
          </div>
          <Skeleton className="hidden h-4 w-16 rounded-md sm:block" />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1 pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={CARD_CLASS}>
              <div
                className="relative overflow-hidden rounded-xl bg-[#f0ebe4]"
                style={{ aspectRatio: "3/4" }}
              >
                <Skeleton className="absolute inset-0 rounded-xl border-0 bg-[#e8dfd4]" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 space-y-1.5 p-3 sm:p-4">
                  <Skeleton className="h-3.5 w-4/5 rounded-md bg-white/50 sm:h-4" />
                  <Skeleton className="h-3 w-1/2 rounded-md bg-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
