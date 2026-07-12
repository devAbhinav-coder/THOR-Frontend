import type { MarketingAttribution } from '@/types';
import { formatMarketingAttributionSummary } from '@/lib/marketingAttribution';

const FIELDS: { key: keyof MarketingAttribution; label: string }[] = [
  { key: 'utmSource', label: 'Source' },
  { key: 'utmMedium', label: 'Medium' },
  { key: 'utmCampaign', label: 'Campaign' },
  { key: 'utmContent', label: 'Ad / content' },
  { key: 'utmTerm', label: 'Term' },
  { key: 'landingPath', label: 'Landing page' },
];

export default function OrderMarketingAttributionCard({
  attribution,
}: {
  attribution?: MarketingAttribution | null;
}) {
  if (!attribution) return null;

  const summary = formatMarketingAttributionSummary(attribution);
  const hasDetail = FIELDS.some((f) => attribution[f.key]);

  if (!summary && !hasDetail && !attribution.fbclid) return null;

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
          Meta / ad attribution
        </p>
        {summary ?
          <p className="text-sm font-semibold text-gray-900 mt-1">{summary}</p>
        : null}
      </div>
      {hasDetail ?
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {FIELDS.map(({ key, label }) => {
            const value = attribution[key];
            if (!value) return null;
            return (
              <div key={key}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900 break-all">{value}</dd>
              </div>
            );
          })}
        </dl>
      : null}
      {attribution.fbclid ?
        <p className="text-[10px] text-gray-500 break-all">
          Meta click id (fbclid) captured
        </p>
      : null}
    </div>
  );
}
