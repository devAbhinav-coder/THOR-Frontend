'use client';

import { useState, lazy, Suspense } from 'react';
import { Warehouse, History, FileText, Receipt } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const InventoryStockTab    = lazy(() => import('./components/InventoryStockTab'));
const InventoryLedgerTab   = lazy(() => import('./components/InventoryLedgerTab'));
const PurchaseInvoicesTab  = lazy(() => import('./components/PurchaseInvoicesTab'));
const GstSummaryTab        = lazy(() => import('./components/GstSummaryTab'));

const TABS = [
  { id: 'stock',    label: 'Stock',             icon: Warehouse,  desc: 'Product & variant stock levels' },
  { id: 'ledger',   label: 'Movement Log',       icon: History,    desc: 'Every stock change tracked' },
  { id: 'purchase', label: 'Purchase Invoices',  icon: FileText,   desc: 'Kharcha / procurement bills' },
  { id: 'gst',      label: 'GST Summary',        icon: Receipt,    desc: 'GSTR-2 purchase summary' },
] as const;

type TabId = typeof TABS[number]['id'];

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-[400px] rounded-xl bg-gray-100" />
    </div>
  );
}

export default function InventoryPage() {
  const [tab, setTab] = useState<TabId>('stock');

  return (
    <div className="p-4 sm:p-6 xl:p-8 max-w-[1600px] mx-auto space-y-6">
      <AdminPageHeader
        title="Inventory"
        badge="Live"
        description="Stock levels, movement history, purchase kharcha, and GST purchase summary — all in one place."
        actions={
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
          >
            <Warehouse className="h-4 w-4 text-brand-600" />
            Products
          </Link>
        }
      />

      {/* Tab Bar */}
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0',
              tab === id
                ? 'bg-navy-900 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-sm text-gray-500 -mt-3">
        {TABS.find(t => t.id === tab)?.desc}
      </p>

      {/* Tab Content */}
      <Suspense fallback={<TabSkeleton />}>
        {tab === 'stock'    && <InventoryStockTab />}
        {tab === 'ledger'   && <InventoryLedgerTab />}
        {tab === 'purchase' && <PurchaseInvoicesTab />}
        {tab === 'gst'      && <GstSummaryTab />}
      </Suspense>
    </div>
  );
}
