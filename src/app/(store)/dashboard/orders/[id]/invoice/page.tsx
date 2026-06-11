'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import OrderInvoiceDocument from '@/components/orders/OrderInvoiceDocument';
import { Button } from '@/components/ui/button';

export default function UserInvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await orderApi.getById(String(params.id));
        setOrder(res.data.order as Order);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [params.id]);

  const canShowInvoice = useMemo(() => {
    if (!order) return false;
    return !!order.invoice?.isGenerated && (order.paymentStatus === 'paid' || order.status === 'delivered');
  }, [order]);

  if (isLoading) {
    return <div className="py-4 text-sm text-account-on-surface-variant">Loading invoice…</div>;
  }
  if (!order) {
    return <div className="py-4 text-sm text-account-on-surface-variant">Order not found.</div>;
  }
  if (!canShowInvoice) {
    return (
      <div className="py-4">
        <p className="text-sm text-account-on-surface-variant">
          Invoice is not available yet. It becomes available once payment is complete or order is delivered and invoice is generated.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href={`/dashboard/orders/${encodeURIComponent(order._id)}`}>Back to Order</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="print:bg-white">
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/orders/${encodeURIComponent(order._id)}`}>Back</Link>
        </Button>
        <Button variant="brand" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <div className="bg-gray-100 p-4 sm:p-6 rounded-lg print:bg-white print:p-0">
        <OrderInvoiceDocument order={order} />
      </div>
    </div>
  );
}
