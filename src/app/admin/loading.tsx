export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto" aria-busy aria-label="Loading admin page">
      <div className="h-9 w-64 max-w-full rounded-lg skeleton" />
      <p className="mt-2 h-4 w-48 rounded skeleton" />
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl skeleton border border-gray-100" />
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-3">
          <div className="h-8 flex-1 max-w-xs rounded-md skeleton" />
          <div className="h-8 w-24 rounded-md skeleton hidden sm:block" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 rounded-lg skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded w-2/5" />
                <div className="h-3 skeleton rounded w-1/3" />
              </div>
              <div className="h-8 w-20 rounded-md skeleton flex-shrink-0 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
