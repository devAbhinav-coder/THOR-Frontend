'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type Product = DashboardAnalytics['topProducts'][number];

export default function TopSellersList({ products }: { products: Product[] }) {
  if (!products.length) {
    return <p className="text-sm text-gray-500 py-6 text-center">No paid sales yet.</p>;
  }

  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div className="space-y-2">
      {products.map((p, i) => {
        const pct = (p.revenue / maxRevenue) * 100;
        return (
          <div key={p._id} className="flex items-center gap-3 py-2">
            <span
              className={`text-xs font-bold w-5 tabular-nums shrink-0 ${
                i === 0 ? 'text-gold-600' : 'text-gray-300'
              }`}
            >
              {i + 1}
            </span>
            <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-gray-50 ring-1 ring-gray-100 shrink-0">
              {p.image ?
                <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
              : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-sm font-bold tabular-nums shrink-0">{formatPrice(p.revenue)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-navy-500 to-brand-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{p.totalSold} u</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
