import Link from "next/link";

export default function NotFound() {
  return (
    <main className='min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center'>
      <p className='text-sm font-semibold uppercase tracking-wider text-brand-600'>
        404
      </p>
      <h1 className='mt-2 text-2xl sm:text-3xl font-serif font-bold text-gray-900'>
        Page not found
      </h1>
      <p className='mt-3 max-w-md text-gray-600'>
        The link may be wrong or the page was moved. Try the home page or shop.
      </p>
      <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
        <Link
          href='/'
          className='rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700'
        >
          Home
        </Link>
        <Link
          href='/gifting'
          className='rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50'
        >
          Gifting
        </Link>
        <Link
          href='/shop'
          className='rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50'
        >
          Shop
        </Link>
      </div>
    </main>
  );
}
