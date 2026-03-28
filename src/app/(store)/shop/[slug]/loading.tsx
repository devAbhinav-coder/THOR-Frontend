export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="aspect-[3/4] rounded-2xl bg-navy-100" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-navy-100" />
          <div className="h-6 w-1/3 rounded bg-navy-100" />
          <div className="h-24 w-full rounded-lg bg-navy-100/80" />
          <div className="h-12 w-full max-w-xs rounded-lg bg-navy-200" />
        </div>
      </div>
    </div>
  );
}
