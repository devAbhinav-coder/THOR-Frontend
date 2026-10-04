"use client";

export default function AnalyticsSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className='pt-1 pb-2 border-b border-gray-200/80'>
      <h2 className='text-sm font-semibold text-navy-900 tracking-tight'>
        {title}
      </h2>
      {description ?
        <p className='text-xs text-gray-500 mt-0.5 leading-relaxed max-w-3xl'>
          {description}
        </p>
      : null}
    </div>
  );
}
