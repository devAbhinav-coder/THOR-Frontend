export default function AdminOrderDetailLoading() {
  return (
    <div
      className='min-h-full bg-[#f6f6f8] pb-16'
      aria-busy
      aria-label='Loading order'
    >
      {/* command bar */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4'>
          <div className='h-8 w-20 rounded-lg skeleton' />
          <div className='flex-1 space-y-2'>
            <div className='flex items-center gap-2'>
              <div className='h-7 w-44 rounded skeleton' />
              <div className='h-6 w-24 rounded-full skeleton' />
              <div className='h-5 w-16 rounded-full skeleton' />
            </div>
            <div className='h-3 w-72 rounded skeleton' />
          </div>
          <div className='hidden sm:flex items-center gap-2'>
            <div className='h-9 w-24 rounded-xl skeleton' />
            <div className='h-9 w-9 rounded-xl skeleton' />
            <div className='h-9 w-24 rounded-xl skeleton' />
            <div className='h-9 w-32 rounded-xl skeleton' />
          </div>
        </div>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 hidden lg:flex gap-4 pb-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-3 w-14 rounded skeleton' />
          ))}
        </div>
      </div>

      <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6'>
        {/* summary strip */}
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 flex items-start gap-3'
            >
              <div className='h-9 w-9 rounded-xl skeleton shrink-0' />
              <div className='flex-1 space-y-2 pt-0.5'>
                <div className='h-2.5 w-16 rounded skeleton' />
                <div className='h-4 w-24 rounded skeleton' />
                <div className='h-2.5 w-20 rounded skeleton' />
              </div>
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-6 items-start'>
          <div className='space-y-6'>
            <Card rows={3} />
            <Card rows={4} tall />
            <Card rows={1} />
          </div>
          <div className='space-y-6'>
            <Card rows={3} />
            <Card rows={4} />
            <Card rows={2} />
            <Card rows={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ rows, tall }: { rows: number; tall?: boolean }) {
  return (
    <div className='rounded-2xl border border-gray-200/80 bg-white overflow-hidden'>
      <div className='px-5 py-3.5 border-b border-gray-100 flex items-center gap-3'>
        <div className='h-8 w-8 rounded-lg skeleton' />
        <div className='h-4 w-32 rounded skeleton' />
      </div>
      <div className='p-5 space-y-4'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='flex gap-4'>
            {tall ?
              <div className='h-[72px] w-[60px] rounded-xl skeleton shrink-0' />
            : null}
            <div className='flex-1 space-y-2 pt-1'>
              <div className='h-3.5 skeleton rounded w-3/4' />
              <div className='h-3 skeleton rounded w-1/2' />
              {tall ? <div className='h-3 skeleton rounded w-1/3' /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
