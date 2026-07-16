import { Skeleton } from "@/components/ui/SkeletonLoader";
import { heroLayout } from "@/lib/heroSectionLayout";
import { cn } from "@/lib/utils";

/** Pixel-matched hero shimmer — image + transparent bottom dock overlay. */
export default function HeroSectionSkeleton() {
  return (
    <section className={heroLayout.section}>
      <div className={heroLayout.media}>
        <Skeleton className="absolute inset-0 h-full w-full rounded-none border-0 bg-navy-900/90" />
        <div className={heroLayout.overlay} aria-hidden />
        <div className={heroLayout.content}>
          <div className={heroLayout.inner}>
            <div className={heroLayout.copy}>
              <div className={heroLayout.badgeSlot}>
                <Skeleton className="h-7 w-28 rounded-full bg-white/15 sm:h-8 sm:w-32" />
              </div>
              <div className={heroLayout.subtitleSlot}>
                <Skeleton className="h-4 w-44 rounded-sm bg-gold-200/25 sm:h-5 sm:w-52" />
              </div>
              <Skeleton className="hidden h-3 w-36 rounded-sm bg-white/25 sm:block sm:w-44" />
              <Skeleton className="mt-3 hidden h-px w-14 bg-white/25 sm:mt-4 sm:block sm:w-20" />
              <div className={heroLayout.titleSlot}>
                <Skeleton className="h-full w-full max-w-xl rounded-md bg-white/22" />
              </div>
              <div className={cn(heroLayout.descriptionSlot, "hidden sm:block")}>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full max-w-lg rounded-sm bg-white/18" />
                  <Skeleton className="h-3 w-[88%] max-w-md rounded-sm bg-white/14" />
                </div>
              </div>
              <div className={heroLayout.ctaSlot}>
                <div className="flex gap-6 sm:gap-8">
                  <Skeleton className="h-4 w-32 rounded-sm bg-white/22" />
                  <Skeleton className="h-4 w-24 rounded-sm bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={heroLayout.bottomDock}>
          <div className={heroLayout.offerStrip}>
            <Skeleton className="mx-auto h-3 w-56 max-w-full rounded-sm bg-gold-200/20" />
          </div>
          <div className={heroLayout.footer}>
            <div className={heroLayout.footerRow}>
              <div className="hidden flex-wrap gap-5 sm:flex">
                <Skeleton className="h-3 w-32 rounded-sm bg-white/18" />
                <Skeleton className="h-3 w-28 rounded-sm bg-white/18" />
                <Skeleton className="h-3 w-28 rounded-sm bg-white/18" />
              </div>
              <div className="flex items-center justify-end gap-3 sm:justify-start">
                <Skeleton className="h-3 w-10 rounded-sm bg-white/18" />
                <Skeleton className="h-px w-8 rounded-full bg-white/25" />
                <Skeleton className="h-px w-3 rounded-full bg-white/18" />
                <Skeleton className="h-px w-3 rounded-full bg-white/18" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
