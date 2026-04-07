'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Order } from '@/types';
import OrderInvoiceDocument from '@/components/orders/OrderInvoiceDocument';
import { Button } from '@/components/ui/button';

export default function AdminInvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await adminApi.getOrderDetails(String(params.id));
        setOrder(res.data.order as Order);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [params.id]);

  if (isLoading) return <div className="p-6">Loading invoice…</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-[820px] mx-auto mb-4 flex items-center gap-2 print:hidden">
        <Button variant="outline" asChild><Link href={`/admin/orders/${encodeURIComponent(order._id)}`}>Back</Link></Button>
        <Button variant="brand" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <OrderInvoiceDocument order={order} />
    </div>
  );
}
