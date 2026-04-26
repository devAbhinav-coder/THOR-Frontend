import { ProductCardSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";

export default function ShopPageSkeleton() {
  return (
    <div>
      {/* Banner area (matches ShopClient top banner section) */}
      <div className='max-w-[1800px] mx-auto px-2 sm:px-4'>
        <div className='relative overflow-hidden rounded-none sm:rounded-2xl'>
          <Skeleton className='h-[140px] sm:h-[220px] lg:h-[230px] w-full rounded-none sm:rounded-2xl' />
        </div>
      </div>

      {/* Breadcrumb + Heading + Sort row */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-3 w-10 rounded' />
          <Skeleton className='h-3 w-3 rounded' />
          <Skeleton className='h-3 w-10 rounded' />
          <Skeleton className='h-3 w-3 rounded' />
          <Skeleton className='h-3 w-28 rounded' />
        </div>

        <div className='mt-4 mb-2 sm:mb-3 flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-2'>
            <Skeleton className='h-7 w-44 sm:w-56 rounded-lg' />
            <Skeleton className='h-4 w-28 rounded' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-24 rounded-xl lg:hidden' />
            <Skeleton className='h-10 w-44 rounded-xl' />
          </div>
        </div>
      </div>

      {/* Filters + Grid */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-7'>
        <div className='lg:flex lg:items-start lg:gap-6'>
          {/* Desktop sidebar */}
          <aside className='hidden lg:block lg:w-64 lg:min-w-64 space-y-5 pr-2 sticky top-20'>
            <Skeleton className='h-4 w-24 rounded' />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-lg' />
            ))}
            <div className='space-y-3'>
              <Skeleton className='h-4 w-20 rounded' />
              <Skeleton className='h-9 w-full rounded-lg' />
              <Skeleton className='h-9 w-full rounded-lg' />
            </div>
          </aside>

          <div className='w-full min-w-0 lg:flex-1 lg:min-h-[70vh] lg:-mt-1 space-y-5'>
            <div className='grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0'>
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

