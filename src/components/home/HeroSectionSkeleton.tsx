import { Skeleton } from "@/components/ui/SkeletonLoader";
import { heroLayout } from "@/lib/heroSectionLayout";
import { cn } from "@/lib/utils";

type Props = { underNavOverlap?: boolean };

/** Pixel-matched hero shimmer - image + transparent bottom dock overlay. */
export default function HeroSectionSkeleton({
  underNavOverlap = false,
}: Props) {
  return (
    <section
      className={cn(
        heroLayout.section,
        underNavOverlap && heroLayout.sectionUnderNav,
      )}
    >
      <div className={heroLayout.media}>
        <Skeleton className='absolute inset-0 h-full w-full rounded-none border-0 bg-navy-900/90' />
        <div className={heroLayout.overlay} aria-hidden />
        <div className={heroLayout.content}>
          <div className={heroLayout.inner}>
            <div className={heroLayout.copyRow}>
              <div className={heroLayout.titleCol}>
                <div className={heroLayout.titleSlot}>
                  <Skeleton className='h-full w-full max-w-[11rem] rounded-md bg-white/22 sm:max-w-xl' />
                </div>
              </div>
              <div className={heroLayout.rightCol}>
                <div
                  className={cn(heroLayout.descriptionSlot, "hidden sm:block")}
                >
                  <div className='space-y-2'>
                    <Skeleton className='ml-auto h-2.5 w-full max-w-[12rem] rounded-sm bg-white/18 lg:max-w-[14rem]' />
                    <Skeleton className='ml-auto h-2.5 w-[88%] max-w-[10rem] rounded-sm bg-white/14' />
                  </div>
                </div>
                <div className={heroLayout.ctaSlot}>
                  <div className='flex flex-col items-end gap-1 sm:flex-row sm:gap-5'>
                    <Skeleton className='h-3 w-20 rounded-sm bg-white/22 sm:h-3.5 sm:w-28' />
                    <Skeleton className='h-3 w-16 rounded-sm bg-white/15 sm:h-3.5 sm:w-20' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={heroLayout.bottomDock}>
          <div className={heroLayout.offerStrip}>
            <Skeleton className='mx-auto h-3 w-56 max-w-full rounded-sm bg-gold-200/20' />
          </div>
          <div className={heroLayout.footer}>
            <div className={heroLayout.footerRow}>
              <div className='hidden flex-wrap gap-5 sm:flex'>
                <Skeleton className='h-3 w-32 rounded-sm bg-white/18' />
                <Skeleton className='h-3 w-28 rounded-sm bg-white/18' />
                <Skeleton className='h-3 w-28 rounded-sm bg-white/18' />
              </div>
              <div className='ml-auto flex items-center justify-end gap-2 sm:ml-0 sm:justify-start sm:gap-3'>
                <Skeleton className='h-2 w-8 rounded-sm bg-white/18 sm:h-3 sm:w-10' />
                <Skeleton className='h-px w-5 rounded-full bg-white/25 sm:w-8' />
                <Skeleton className='h-px w-2 rounded-full bg-white/18 sm:w-3' />
                <Skeleton className='h-px w-2 rounded-full bg-white/18 sm:w-3' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
