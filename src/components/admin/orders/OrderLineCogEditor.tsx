'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { isManualLineMissingCost } from '@/lib/offlineOrder';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  lineIndex: number;
  quantity: number;
  unitPrice: number;
  costAtSale?: number | null;
  onSaved: (costAtSale: number) => void;
};

export default function OrderLineCogEditor({
  orderId,
  lineIndex,
  quantity,
  unitPrice,
  costAtSale,
  onSaved,
}: Props) {
  const missing = isManualLineMissingCost({
    isOfflineManual: true,
    costAtSale,
  });
  const [value, setValue] = useState(
    costAtSale != null && costAtSale > 0 ? String(costAtSale) : '',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(costAtSale != null && costAtSale > 0 ? String(costAtSale) : '');
  }, [costAtSale]);

  const parsed = Number(value);
  const unitCost = Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
  const revenue = unitPrice * quantity;
  const cogs = Number.isFinite(unitCost) ? unitCost * quantity : 0;
  const profit = revenue - cogs;
  const margin = revenue > 0 && Number.isFinite(unitCost) ? (profit / revenue) * 100 : 0;

  const handleSave = async () => {
    if (!Number.isFinite(unitCost)) {
      toast.error('Enter a valid cost of goods per unit.');
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.updateOrderLineCostAtSale(orderId, lineIndex, unitCost);
      const saved =
        (res.data as { costAtSale?: number } | undefined)?.costAtSale ?? unitCost;
      onSaved(saved);
      toast.success('Cost of goods saved');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err ?
          String((err as { message?: string }).message)
        : 'Could not save cost of goods';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'mt-3 rounded-xl border p-3 space-y-2',
        missing ?
          'border-amber-200 bg-amber-50/70'
        : 'border-emerald-200 bg-emerald-50/50',
      )}
    >
      <div className='flex items-start gap-2'>
        {missing ?
          <AlertTriangle className='h-4 w-4 text-amber-600 shrink-0 mt-0.5' />
        : <Check className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />}
        <div className='min-w-0 flex-1'>
          <p className='text-xs font-semibold text-gray-900'>
            Cost of goods (COGS)
            {missing ?
              <span className='ml-1.5 text-amber-700 font-bold'>· Not set</span>
            : null}
          </p>
          <p className='text-[10px] text-gray-500 mt-0.5'>
            Manual category line — enter purchase cost so revenue reports stay accurate.
          </p>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-2 sm:items-end'>
        <label className='flex-1 block space-y-1'>
          <span className='text-[10px] font-medium text-gray-600 uppercase tracking-wide'>
            Per unit (₹)
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Purchase cost'
            className='h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
          />
        </label>
        <Button
          type='button'
          variant='brand'
          size='sm'
          className='rounded-lg shrink-0 h-10 px-4'
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ?
            <Loader2 className='h-4 w-4 animate-spin' />
          : 'Save COGS'}
        </Button>
      </div>

      {Number.isFinite(unitCost) ?
        <p className='text-[11px] text-gray-600'>
          Line: revenue {formatPrice(revenue)} · COGS {formatPrice(cogs)} · profit{' '}
          <span className='font-semibold text-emerald-800'>{formatPrice(profit)}</span>
          {revenue > 0 ?
            <span className='text-gray-400'> ({margin.toFixed(0)}%)</span>
          : null}
        </p>
      : null}
    </div>
  );
}
