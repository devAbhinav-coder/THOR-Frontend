export default function AdminOrderDetailLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-pulse" aria-busy aria-label="Loading order">
      <div className="h-9 w-36 rounded-lg bg-gray-200 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="flex gap-4">
              <div className="h-24 w-20 rounded-lg bg-gray-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-40" />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-48" />
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-36" />
        </div>
      </div>
    </div>
  );
}
