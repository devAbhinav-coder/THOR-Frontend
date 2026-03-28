export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-56 shrink-0 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-navy-100" />
          ))}
        </aside>
        <div className="flex-1 space-y-4">
          <div className="h-10 w-full max-w-md rounded-lg bg-navy-100" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-navy-100/90" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
