export default function AdminOrdersLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl animate-pulse" aria-busy aria-label="Loading orders">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="h-9 w-40 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-gray-100" />
          <div className="h-10 w-28 rounded-lg bg-gray-100 hidden sm:block" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 border border-gray-100" />
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-11 bg-gray-50 border-b border-gray-100 px-4 flex items-center gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-16 rounded bg-gray-200" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
            <div className="h-12 w-12 rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-8 w-24 rounded-md bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
