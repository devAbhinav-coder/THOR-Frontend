export default function CartLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-navy-100" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-2xl border border-navy-100">
          <div className="h-24 w-24 shrink-0 rounded-lg bg-navy-100" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded bg-navy-100" />
            <div className="h-4 w-1/3 rounded bg-navy-100/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
