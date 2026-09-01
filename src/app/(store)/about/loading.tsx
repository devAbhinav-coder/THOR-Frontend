export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16" aria-busy aria-label="Loading about">
      <div className="h-10 w-48 rounded-lg skeleton" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-11/12 rounded skeleton" />
        <div className="h-4 w-4/5 rounded skeleton" />
      </div>
    </div>
  );
}
