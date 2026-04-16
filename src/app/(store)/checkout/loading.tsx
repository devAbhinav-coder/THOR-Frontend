import { Skeleton } from "@/components/ui/SkeletonLoader";

/** Matches checkout layout (lines + summary) — avoids the old parent store skeleton (shop grid) flash. */
export default function CheckoutLoading() {
  return (
    <div className='min-h-[min(85vh,780px)] w-full bg-[#faf9f7]'>
      <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-24 rounded-full' />
            <Skeleton className='h-9 w-48 rounded-xl sm:w-56' />
          </div>
          <Skeleton className='hidden h-10 w-32 rounded-xl sm:block' />
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
          <div className='space-y-4 lg:col-span-7'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className='flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5'
              >
                <Skeleton className='h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-5 w-4/5' />
                  <Skeleton className='h-4 w-2/5' />
                  <div className='flex gap-2 pt-2'>
                    <Skeleton className='h-10 w-24 rounded-xl' />
                    <Skeleton className='h-10 w-24 rounded-xl' />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className='lg:col-span-5'>
            <div className='space-y-4 rounded-2xl border border-gray-100 bg-white p-5'>
              <Skeleton className='h-6 w-36' />
              <div className='space-y-2'>
                <div className='flex justify-between gap-4'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between gap-4'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
              <Skeleton className='h-11 w-full rounded-xl' />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
