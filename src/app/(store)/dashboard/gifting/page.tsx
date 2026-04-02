"use client";

import { useQuery } from "@tanstack/react-query";
import { giftingApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { Gift, Clock, ChevronRight, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Pending Review", color: "text-blue-600 bg-blue-50", icon: Clock },
  price_quoted: { label: "Quote Ready", color: "text-purple-600 bg-purple-50", icon: AlertCircle },
  approved_by_user: { label: "Approved", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  rejected_by_user: { label: "Rejected", color: "text-red-600 bg-red-50", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "text-gray-500 bg-gray-50", icon: AlertCircle },
};

export default function UserGiftingRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-gifting-requests"],
    queryFn: () => giftingApi.getMyRequests(),
    staleTime: 0,             // always consider cache stale
    refetchOnMount: "always", // always hit the server on mount
  });

  const requests = data?.data?.requests || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-gold-500" />
            Custom Gift Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your personalized gift quotes and approvals</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-gray-200" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No requests yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            When you request customization for a product, it will appear here.
          </p>
          <Link
            href="/gifting"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            Explore Gifting
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req: any) => {
            const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
            const StatusIcon = status.icon;

            return (
              <Link
                key={req._id}
                href={`/dashboard/gifting/${encodeURIComponent(req._id)}`}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50">
                  {req.items?.[0]?.product?.images?.[0]?.url ? (
                    <Image
                      src={req.items[0].product.images[0].url}
                      alt={req.items[0].name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-200" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider", status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(req.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {req.occasion} Gift Request
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.items.length} item{req.items.length !== 1 ? 's' : ''} · {req.packagingPreference} packaging
                  </p>
                  {req.status === 'price_quoted' && (
                    <p className="text-xs font-bold text-brand-600 mt-1">
                      Quote: {formatPrice(req.quotedPrice)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {req.status === 'price_quoted' && (
                    <span className="hidden sm:block text-[10px] font-bold text-white bg-brand-600 px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-brand-700 transition-colors">
                      Action Required
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-brand-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
