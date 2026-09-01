export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12" aria-busy aria-label="Loading journal">
      <div className="h-10 w-56 max-w-full rounded-lg skeleton" />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="aspect-[16/10] skeleton" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-3/4 rounded skeleton" />
              <div className="h-4 w-1/2 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
