'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Percent, Archive, QrCode, Copy } from 'lucide-react';
import { saleCampaignApi } from '@/lib/api';
import { SaleCampaign } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SaleCampaignFormModal from '@/components/admin/SaleCampaignFormModal';
import toast from 'react-hot-toast';
import { getSiteUrl } from '@/lib/siteUrl';
import { buildBrandedQrDataUrl, downloadDataUrl, shareInvite } from '@/lib/brandedQr';

export default function AdminSalesPage() {
  const [campaigns, setCampaigns] = useState<SaleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<SaleCampaign | null>(null);
  const site = useMemo(() => getSiteUrl(), []);
  const storeUrl = `${site}/shop`;

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await saleCampaignApi.getAll();
      const list = res.data?.campaigns;
      setCampaigns(Array.isArray(list) ? (list as SaleCampaign[]) : []);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale campaign?')) return;
    try {
      await saleCampaignApi.delete(id);
      toast.success('Sale deleted');
      fetchCampaigns();
    } catch {
      toast.error('Failed to delete sale');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive sale "${name}"?`)) return;
    try {
      await saleCampaignApi.archive(id);
      toast.success('Sale archived');
      fetchCampaigns();
    } catch {
      toast.error('Failed to archive sale');
    }
  };

  const shareSale = async (c: SaleCampaign) => {
    try {
      const qr = await buildBrandedQrDataUrl(storeUrl, {
        title: 'The House of Rani',
        subtitle: c.name || 'Sale',
      });
      downloadDataUrl(qr, `HOR-sale-QR-${c._id}.png`);
      await shareInvite({
        url: storeUrl,
        title: 'The House of Rani',
        text: `${c.name || 'Sale'} at The House of Rani — shop now:\n${storeUrl}`,
        qrDataUrl: qr,
        filename: `HOR-sale-QR-${c._id}.png`,
      });
      toast.success('QR ready · share opened');
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      toast.error((err as Error)?.message || 'Could not share sale');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Catalog Pricing</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Sale</h1>
        <p className="text-sm text-white/80 mt-1">
          Put categories or products on sale — prices update on shop and PDP while live. Optional
          popup image shows on store visits. Use QR / link to send customers to the shop.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(storeUrl);
                toast.success('Shop link copied');
              } catch {
                toast.error('Could not copy');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
          >
            <Copy className="h-3.5 w-3.5" /> Copy shop link
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{campaigns.length} campaigns</p>
        <Button
          variant="brand"
          onClick={() => {
            setEditCampaign(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Create Sale
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ?
          <div className="p-8 text-center text-gray-400">Loading...</div>
        : campaigns.length === 0 ?
          <div className="p-12 text-center">
            <Percent className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sale campaigns yet.</p>
          </div>
        : <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Discount</th>
                  <th className="text-left px-5 py-3">Scope</th>
                  <th className="text-left px-5 py-3">Window</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.badgeText ?
                        <p className="text-xs text-brand-700 mt-0.5">Badge: {c.badgeText}</p>
                      : null}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%`
                        : c.discountType === 'fixed'
                          ? `At ₹${c.discountValue}`
                          : `₹${c.discountValue} off`}
                    </td>
                    <td className="px-5 py-3.5 text-sm capitalize text-gray-600">{c.scopeType}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={c.isActive ? 'success' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          className="p-2 text-gray-400 hover:text-emerald-700"
                          title="Copy shop link + download QR"
                          onClick={() => shareSale(c)}
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-brand-700"
                          onClick={() => {
                            setEditCampaign(c);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-amber-700"
                          onClick={() => handleArchive(c._id, c.name)}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(c._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {isModalOpen ?
        <SaleCampaignFormModal
          campaign={editCampaign}
          onClose={() => {
            setIsModalOpen(false);
            setEditCampaign(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setEditCampaign(null);
            fetchCampaigns();
          }}
        />
      : null}
    </div>
  );
}
