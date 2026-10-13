"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User as UserIcon,
} from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import AdminOrderSectionCard, { MetaRow, MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

export type OrderUserLite = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isPosGuest?: boolean;
};

export function getOrderUser(order: Order): OrderUserLite | null {
  if (typeof order.user === "object" && order.user) {
    return order.user as OrderUserLite;
  }
  return null;
}

export function getOrderUserId(order: Order): string | null {
  if (typeof order.user === "string") return order.user;
  if (typeof order.user === "object" && order.user && "_id" in order.user) {
    return String((order.user as { _id: string })._id);
  }
  return null;
}

const SEGMENT: Record<string, { label: string; className: string; hint: string }> = {
  frequent_buyer: {
    label: "VIP",
    className: "bg-amber-100 text-amber-950 ring-amber-200",
    hint: "Frequent buyer - high lifetime value",
  },
  repeat_buyer: {
    label: "Returning",
    className: "bg-slate-100 text-slate-800 ring-slate-200",
    hint: "Has ordered before",
  },
  new_buyer: {
    label: "Member",
    className: "bg-emerald-50 text-emerald-900 ring-emerald-100",
    hint: "First paid order",
  },
  prospect: {
    label: "New",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
    hint: "No paid orders yet",
  },
};

export function CustomerSegmentBadge({ segment }: { segment: string | null }) {
  if (!segment) return null;
  const t = SEGMENT[segment] ?? {
    label: segment.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-700 ring-gray-200",
    hint: "Based on paid orders and lifetime spend",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1 ring-inset px-2 py-0.5 text-[11px] font-semibold",
        t.className,
      )}
      title={t.hint}
    >
      <Award className='h-3 w-3 shrink-0 opacity-90' aria-hidden />
      {t.label}
    </span>
  );
}

function waHref(phone?: string | null): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  let e164 = digits;
  if (digits.length === 10) e164 = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) e164 = `91${digits.slice(1)}`;
  else if (digits.length < 10) return null;
  return `https://wa.me/${e164}`;
}

function formatAddressLines(a: Order["shippingAddress"]): string[] {
  const lines: string[] = [];
  if (a.house) lines.push(a.house);
  if (a.street) lines.push(a.street);
  if (a.landmark) lines.push(`Landmark: ${a.landmark}`);
  lines.push([a.city, a.state].filter(Boolean).join(", ") + (a.pincode ? ` - ${a.pincode}` : ""));
  if (a.country && a.country.toLowerCase() !== "india") lines.push(a.country);
  return lines.filter(Boolean);
}

export default function AdminOrderCustomerCard({
  order,
  customerSegment,
}: {
  order: Order;
  customerSegment: string | null;
}) {
  const user = getOrderUser(order);
  const uid = getOrderUserId(order);
  const addr = order.shippingAddress;
  const addrLines = addr ? formatAddressLines(addr) : [];
  const addrText = [addr?.name, ...addrLines, addr?.phone].filter(Boolean).join("\n");
  const mapsHref =
    addrLines.length > 0 ?
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        addrLines.filter((l) => !l.startsWith("Landmark")).join(", "),
      )}`
    : null;

  const phone = user?.phone || addr?.phone || null;
  const wa = waHref(phone);
  const sameContact = Boolean(addr?.phone && user?.phone && addr.phone === user.phone);
  const isB2b = order.offlineMeta?.source === "b2b";
  const channelLabel =
    order.offlineMeta?.source === "b2b" ? "B2B / wholesale"
    : order.offlineMeta?.source === "stall" ? "Stall / POS"
    : order.offlineMeta?.source === "personal_contact" ? "Personal contact"
    : null;

  return (
    <AdminOrderSectionCard
      id='customer'
      icon={UserIcon}
      tone='brand'
      title='Customer'
      action={
        uid ?
          <Link
            href={`/admin/users?highlight=${encodeURIComponent(uid)}`}
            className='inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline'
          >
            Profile <ExternalLink className='h-3 w-3' />
          </Link>
        : null
      }
      bodyClassName='space-y-5'
    >
      {/* identity */}
      <div className='flex items-center gap-3'>
        {user?.avatar ?
          <div className='relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-sm shrink-0'>
            <Image
              src={user.avatar}
              alt={user?.name || "Customer"}
              fill
              sizes='48px'
              className='object-cover'
            />
          </div>
        : <div className='h-12 w-12 rounded-full bg-gradient-to-br from-brand-100 to-navy-100 flex items-center justify-center text-base font-black text-brand-800 shrink-0 ring-2 ring-white shadow-sm'>
            {String(user?.name || addr?.name || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
        }
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm font-semibold text-gray-900 truncate'>
              {user?.name || addr?.name || "-"}
            </p>
            <CustomerSegmentBadge segment={customerSegment} />
            {user?.isPosGuest ?
              <span className='inline-flex items-center rounded-full bg-gray-100 ring-1 ring-inset ring-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600'>
                POS guest
              </span>
            : null}
          </div>
          {channelLabel ?
            <p className='text-[11px] text-gray-500 mt-0.5'>{channelLabel}</p>
          : null}
        </div>
      </div>

      {/* contact */}
      <div className='space-y-1.5'>
        {user?.email ?
          <ContactRow icon={Mail} href={`mailto:${user.email}`} value={user.email} copyLabel='Copy email' />
        : null}
        {phone ?
          <ContactRow
            icon={Phone}
            href={`tel:${phone}`}
            value={phone}
            copyLabel='Copy phone'
            extra={
              wa ?
                <a
                  href={wa}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold hover:bg-emerald-100'
                >
                  <MessageCircle className='h-3 w-3' /> WhatsApp
                </a>
              : null
            }
          />
        : null}
        {!user?.email && !phone ?
          <p className='text-xs text-gray-400'>No contact details on file.</p>
        : null}
      </div>

      {/* B2B */}
      {isB2b ?
        <div className='rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-1.5'>
            <Building2 className='h-3.5 w-3.5 text-emerald-700' />
            <MicroLabel className='text-emerald-800'>B2B buyer</MicroLabel>
          </div>
          {order.b2bMeta?.companyName || order.b2bMeta?.gstin || order.b2bMeta?.poNumber ?
            <dl className='divide-y divide-emerald-100/80'>
              {order.b2bMeta?.companyName ?
                <MetaRow label='Company'>
                  <span className='font-semibold'>{order.b2bMeta.companyName}</span>
                </MetaRow>
              : null}
              {order.b2bMeta?.gstin ?
                <MetaRow label='GSTIN' mono>
                  <span className='inline-flex items-center gap-1'>
                    {order.b2bMeta.gstin}
                    <AdminCopyButton value={order.b2bMeta.gstin} label='Copy GSTIN' iconOnly />
                  </span>
                </MetaRow>
              : null}
              {order.b2bMeta?.poNumber ?
                <MetaRow label='PO number'>{order.b2bMeta.poNumber}</MetaRow>
              : null}
            </dl>
          : <p className='text-xs text-gray-600'>
              No company / GSTIN saved - add buyer details when creating the tax
              invoice.
            </p>
          }
        </div>
      : null}

      {/* shipping address */}
      <div className='pt-4 border-t border-gray-100'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1.5'>
            <MapPin className='h-3.5 w-3.5 text-gray-400' />
            <MicroLabel>Ship to</MicroLabel>
          </div>
          <div className='flex items-center gap-1'>
            {addrText ?
              <AdminCopyButton value={addrText} label='Copy address' />
            : null}
            {mapsHref ?
              <a
                href={mapsHref}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              >
                Maps <ExternalLink className='h-3 w-3' />
              </a>
            : null}
          </div>
        </div>
        {addr ?
          <address className='not-italic text-sm text-gray-800 leading-relaxed'>
            <p className='font-semibold text-gray-900'>{addr.name || "-"}</p>
            {addrLines.map((l, i) => (
              <p key={i} className={cn(l.startsWith("Landmark") && "text-gray-500 text-xs")}>
                {l}
              </p>
            ))}
            {addr.phone && !sameContact ?
              <p className='text-xs text-gray-500 mt-1 inline-flex items-center gap-1'>
                <Phone className='h-3 w-3' /> {addr.phone}
              </p>
            : null}
          </address>
        : <p className='text-xs text-gray-400'>No shipping address (offline handover).</p>
        }
        {order.offlineMeta?.fulfillment === "offline_handover" ?
          <p className='mt-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700'>
            Offline handover - no courier
          </p>
        : null}
      </div>
    </AdminOrderSectionCard>
  );
}

function ContactRow({
  icon: Icon,
  href,
  value,
  copyLabel,
  extra,
}: {
  icon: typeof Mail;
  href: string;
  value: string;
  copyLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-2 text-sm min-w-0'>
      <Icon className='h-3.5 w-3.5 text-gray-400 shrink-0' aria-hidden />
      <a
        href={href}
        className='text-gray-800 hover:text-brand-700 hover:underline truncate min-w-0'
      >
        {value}
      </a>
      <AdminCopyButton value={value} label={copyLabel} iconOnly />
      {extra}
    </div>
  );
}
