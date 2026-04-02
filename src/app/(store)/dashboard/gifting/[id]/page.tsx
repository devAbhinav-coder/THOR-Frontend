"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { giftingApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import {
  Gift, Clock, ArrowLeft, Package, CheckCircle2,
  XCircle, AlertCircle, Loader2, MapPin,
  Phone, User, Home, Building2, ChevronDown, ExternalLink,
  Sparkles, MessageSquare, ShoppingBag,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string; stamp?: string }> = {
  new: {
    label: "Under Review",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: Clock,
    description: "Our team is reviewing your customization request. We'll send you a quote within 24 hours.",
  },
  price_quoted: {
    label: "Quote Ready — Action Required",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    icon: AlertCircle,
    description: "We've prepared a quote for your request. Please review the details below and accept or reject.",
  },
  approved_by_user: {
    label: "Confirmed",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    description: "Your order has been created. Our team will contact you to arrange payment and production.",
  },
  rejected_by_user: {
    label: "Rejected",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: XCircle,
    description: "You've rejected this quote. This request is now closed. Feel free to submit a new request.",
    stamp: "REJECTED",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: XCircle,
    description: "This request has been cancelled.",
    stamp: "CANCELLED",
  },
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh",
];

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-400";

// ── Collapsible Item Card ────────────────────────────────────────────────────
function ItemCard({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const hasAnswers = item.customFieldAnswers?.length > 0;
  const hasDesc = !!item.product?.description;
  const hasExtra = hasAnswers || hasDesc;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        className="w-full flex gap-4 p-4 text-left"
        onClick={() => hasExtra && setOpen(!open)}
      >
        <div className="relative h-16 w-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
          {item.product?.images?.[0]?.url ? (
            <Image src={item.product.images[0].url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-200" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-sm">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Qty: <span className="font-semibold text-gray-700">{item.quantity}</span>
              </p>
            </div>
            {hasExtra && (
              <ChevronDown className={cn("h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200", open && "rotate-180")} />
            )}
          </div>
        </div>
      </button>

      {open && hasExtra && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3 bg-gray-50/50">
          {hasDesc && (
            <p className="text-xs text-gray-500 leading-relaxed">{item.product.description}</p>
          )}
          {hasAnswers && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Customization</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.customFieldAnswers.map((ans: any, j: number) => (
                  <div key={j} className="bg-white rounded-xl border border-gray-100 px-3 py-2">
                    <p className="text-[10px] text-gray-400 font-semibold">{ans.label}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{ans.value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function UserRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    label: "Home",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["gifting-request", id],
    queryFn: () => giftingApi.getRequestById(id),
    staleTime: 0,
  });

  const request = data?.data?.request;

  const respondMutation = useMutation({
    mutationFn: ({ action, shippingAddress }: { action: 'accept' | 'reject'; shippingAddress?: typeof address }) =>
      giftingApi.respondToQuote(id, action, shippingAddress),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["gifting-request", id] });
      queryClient.invalidateQueries({ queryKey: ["my-gifting-requests"] });
      if (vars.action === 'accept') {
        toast.success("Order confirmed! Our team will contact you for payment & delivery.");
        const orderId = res.data?.orderId;
        router.push(orderId ? `/dashboard/orders/${encodeURIComponent(String(orderId))}` : "/dashboard/orders");
      } else {
        toast.success("Quote rejected.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Something went wrong");
    },
  });

  const loadSavedAddress = (addressId: string) => {
    const addr = user?.addresses?.find((a: any) => a._id === addressId);
    if (addr) {
      setAddress({
        name: addr.name || user?.name || "",
        phone: addr.phone || user?.phone || "",
        street: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        country: addr.country || "India",
        label: addr.label || "Home",
      });
    }
  };

  const handleAccept = () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in all required address fields.");
      return;
    }
    respondMutation.mutate({ action: 'accept', shippingAddress: address });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="h-10 w-10 text-brand-500 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Loading your request...</p>
    </div>
  );

  if (!request) return (
    <div className="py-24 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900">Request not found</h2>
      <Link href="/dashboard/gifting" className="mt-4 text-brand-600 font-semibold hover:underline flex items-center justify-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>
    </div>
  );

  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.new;
  const StatusIcon = status.icon;
  const isClosed = request.status === 'rejected_by_user' || request.status === 'cancelled';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Bespoke Request</h1>
          <p className="text-gray-400 text-xs font-mono mt-0.5">#{String(request._id).slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 relative", isClosed && "opacity-80")}>

        {/* ── Watermark Stamp ── */}
        {isClosed && status.stamp && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center rotate-[-15deg]">
            <div className="border-[6px] border-red-400/30 rounded-2xl px-8 py-4">
              <p className="text-red-400/30 font-black text-6xl tracking-[0.3em] select-none">{status.stamp}</p>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status Banner */}
          <div className={cn("rounded-2xl p-5 border flex gap-4 items-start", status.color)}>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60">
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">{status.label}</h3>
              <p className="text-sm opacity-80 mt-0.5 leading-relaxed">{status.description}</p>
              <p className="text-[11px] opacity-60 mt-2">Submitted on {formatDate(request.createdAt)}</p>
            </div>
          </div>

          {/* Linked Order Card — shown after approval */}
          {request.status === 'approved_by_user' && request.linkedOrderId && (
            <Link
              href={`/dashboard/orders/${encodeURIComponent(request.linkedOrderId)}`}
              className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 hover:bg-emerald-100/60 transition-colors group"
            >
              <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Order Created</p>
                <p className="text-sm font-bold text-emerald-900">View your order details & track delivery</p>
              </div>
              <ExternalLink className="h-4 w-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}

          {/* Quote Card */}
          {request.status === 'price_quoted' && (
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-7 text-white shadow-xl shadow-brand-100/40">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-bold text-brand-200 uppercase tracking-widest mb-1">Quote Total</p>
                  <p className="text-4xl font-serif font-bold">{formatPrice(request.quotedPrice)}</p>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Gift className="h-6 w-6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-brand-200 font-bold uppercase tracking-wider mb-1">Delivery Time</p>
                  <p className="text-sm font-semibold">{request.deliveryTime || "To be confirmed"}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-brand-200 font-bold uppercase tracking-wider mb-1">Payment</p>
                  <p className="text-sm font-semibold">Team will contact you</p>
                </div>
              </div>
              {request.adminNote && (
                <div className="mt-4 bg-white/10 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] text-brand-200 font-bold uppercase tracking-wider mb-1">Note from Team</p>
                  <p className="text-sm text-white/90 leading-relaxed">{request.adminNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Note — shown on non-quote states if present */}
          {request.adminNote && request.status !== 'price_quoted' && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <MessageSquare className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Note from Our Team</p>
                <p className="text-sm text-amber-900 leading-relaxed">{request.adminNote}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-brand-500" />
              Requested Items ({request.items?.length || 0})
              <span className="text-xs text-gray-400 font-normal ml-1">— tap to expand details & customizations</span>
            </h3>
            {request.items?.map((item: any, i: number) => <ItemCard key={i} item={item} />)}
          </div>

          {/* Messages & Notes */}
          <div className={cn(
            "grid grid-cols-1 gap-4", 
            [request.recipientMessage, request.customizationNote, request.customPackagingNote].filter(Boolean).length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"
          )}>
            {request.recipientMessage && (
              <div className="bg-gold-50/60 border border-gold-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Recipient Message
                </p>
                <p className="text-sm text-gray-800 italic leading-relaxed break-words whitespace-pre-wrap">"{request.recipientMessage}"</p>
              </div>
            )}
            {request.customizationNote && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Customization Note
                </p>
                <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">{request.customizationNote}</p>
              </div>
            )}
            {request.packagingPreference === "custom" && request.customPackagingNote && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Package className="h-3 w-3" /> Custom Packaging Request
                </p>
                <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">{request.customPackagingNote}</p>
              </div>
            )}
          </div>

          {/* Reference Images */}
          {request.referenceImages?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Reference Images You Shared</h3>
              <div className="flex flex-wrap gap-3">
                {request.referenceImages.map((img: any, i: number) => (
                  <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                    className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                    <Image src={img.url} alt={`Reference ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Quote Accept Panel */}
          {request.status === 'price_quoted' && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl shadow-gray-100 sticky top-6">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Accept Quote</h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                Confirm your delivery address and accept the quote. Our team will contact you to arrange payment and production.
              </p>

              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full py-4 px-6 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Gift className="h-5 w-5" />
                  Accept Quote & Enter Address
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Saved addresses */}
                  {user?.addresses && user.addresses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saved Addresses</p>
                      {user.addresses.map((addr: any) => (
                        <label key={addr._id}
                          className={cn(
                            "flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all",
                            selectedAddressId === addr._id ? "border-brand-500 bg-brand-50" : "border-gray-100 hover:border-brand-200"
                          )}>
                          <input type="radio" name="address" value={addr._id} checked={selectedAddressId === addr._id}
                            onChange={(e) => { setSelectedAddressId(e.target.value); loadSavedAddress(e.target.value); }}
                            className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {addr.label === "Home" ? <Home className="h-3 w-3 text-gray-400" /> : <Building2 className="h-3 w-3 text-gray-400" />}
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{addr.label}</span>
                            </div>
                            <p className="text-xs text-gray-700 font-medium mt-0.5 line-clamp-2">{addr.street}, {addr.city}, {addr.pincode}</p>
                          </div>
                        </label>
                      ))}
                      <button onClick={() => { setSelectedAddressId(""); setAddress({ name: user?.name || "", phone: user?.phone || "", street: "", city: "", state: "", pincode: "", country: "India", label: "Home" }); }}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                        + Enter a different address
                      </button>
                    </div>
                  )}

                  {/* Manual address form */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Address</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                        <input className={inputCls} value={address.name} onChange={e => setAddress(p => ({ ...p, name: e.target.value }))} placeholder="Recipient name" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Phone *</label>
                        <input className={inputCls} value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit" inputMode="numeric" maxLength={10} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Street Address *</label>
                      <textarea className={`${inputCls} resize-none`} value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} placeholder="House no, building, street, area" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">City *</label>
                        <input className={inputCls} value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Pincode *</label>
                        <input className={inputCls} value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} placeholder="6-digit pincode" inputMode="numeric" maxLength={6} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">State *</label>
                      <select className={inputCls} value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}>
                        <option value="">Select state…</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Label</label>
                      <div className="flex gap-2">
                        {["Home", "Work", "Other"].map(l => (
                          <button key={l} type="button" onClick={() => setAddress(p => ({ ...p, label: l }))}
                            className={cn("flex-1 py-2 text-xs font-bold rounded-xl border transition-all",
                              address.label === l ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-brand-200"
                            )}>
                            {l === "Home" ? <Home className="h-3 w-3 inline mr-1" /> : l === "Work" ? <Building2 className="h-3 w-3 inline mr-1" /> : null}{l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAccept}
                    disabled={respondMutation.isPending}
                    className="w-full py-4 px-6 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  >
                    {respondMutation.isPending
                      ? <><Loader2 className="h-5 w-5 animate-spin" /> Confirming Order...</>
                      : <><CheckCircle2 className="h-5 w-5" /> Confirm Order</>}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reject this quote? This will close the request.")) {
                        respondMutation.mutate({ action: 'reject' });
                      }
                    }}
                    disabled={respondMutation.isPending}
                    className="w-full py-3 px-6 bg-white text-red-600 border border-red-100 rounded-2xl font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Quote
                  </button>
                </div>
              )}

              {/* Reject button when address form not shown */}
              {!showAddressForm && (
                <button
                  onClick={() => { if (confirm("Reject this quote?")) respondMutation.mutate({ action: 'reject' }); }}
                  disabled={respondMutation.isPending}
                  className="w-full mt-3 py-3 text-red-500 text-sm font-semibold hover:text-red-700 transition-colors"
                >
                  Reject Quote
                </button>
              )}
            </div>
          )}

          {/* Summary Card — always shown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Request Summary</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { icon: User, label: "Contact", value: request.name },
                { icon: MapPin, label: "Occasion", value: request.occasion },
                { icon: Phone, label: "Phone", value: request.phone || "—" },
                { icon: Gift, label: "Packaging", value: request.packagingPreference },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                  <span className="text-gray-500 flex-shrink-0">{label}</span>
                  <span className="font-semibold text-gray-900 text-right flex-1 truncate capitalize">{value}</span>
                </div>
              ))}
              {request.proposedPrice > 0 && (
                <div className="pt-2 mt-1 border-t border-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Your Budget</span>
                    <span className="font-bold text-amber-600">{formatPrice(request.proposedPrice)}</span>
                  </div>
                </div>
              )}
              {request.quotedPrice > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Quoted Price</span>
                  <span className="font-bold text-brand-700 text-base">{formatPrice(request.quotedPrice)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rejected/Cancelled — CTA to start new request */}
          {isClosed && (
            <Link
              href="/gifting"
              className="flex items-center gap-3 bg-navy-900 rounded-2xl p-4 hover:bg-navy-800 transition-colors group"
            >
              <div className="h-10 w-10 bg-gold-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-gold-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Start a new request</p>
                <p className="text-gray-400 text-xs">Browse our gifting collection →</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
