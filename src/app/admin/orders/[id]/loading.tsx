export default function AdminOrderDetailLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl" aria-busy aria-label="Loading order">
      <div className="h-9 w-36 rounded-lg skeleton mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="h-6 w-48 rounded skeleton" />
            <div className="flex gap-4">
              <div className="h-24 w-20 rounded-lg skeleton" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-3 skeleton rounded w-1/3" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-40 skeleton" />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-48 skeleton" />
          <div className="rounded-xl border border-gray-200 bg-white p-5 h-36 skeleton" />
        </div>
      </div>
    </div>
  );
}
