export default function DashboardLoading() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 skeleton" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="h-14 border-b border-gray-100 bg-gray-50/80 skeleton" />
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-4">
              <div className="flex gap-1.5">
                <div className="h-14 w-11 rounded-xl skeleton" />
                <div className="h-14 w-11 rounded-xl skeleton" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-3 skeleton rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
