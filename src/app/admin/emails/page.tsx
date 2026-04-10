"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, Sparkles, Users, ShieldCheck, Globe2, ArrowUpRight } from "lucide-react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type Audience = "users" | "admins" | "all";

const presetMessages = [
  {
    title: "Festive launch",
    subject: "Festive Collection is Live",
    body: "Our festive collection is now live with fresh arrivals across sarees, lehengas and suits.",
  },
  {
    title: "Coupon reminder",
    subject: "Your offer is waiting",
    body: "Use your active coupon before expiry and grab your favorites today.",
  },
  {
    title: "Order delay update",
    subject: "Shipping update from our team",
    body: "We are sharing a quick update regarding dispatch timelines. Thank you for your patience.",
  },
];

const audienceMeta: Record<Audience, { icon: JSX.Element; label: string }> = {
  users: { icon: <Users className='h-4 w-4' />, label: "All users" },
  admins: { icon: <ShieldCheck className='h-4 w-4' />, label: "Admins only" },
  all: { icon: <Globe2 className='h-4 w-4' />, label: "Everyone" },
};

export default function AdminEmailsPage() {
  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/shop");
  const [audience, setAudience] = useState<Audience>("users");
  const [isSending, setIsSending] = useState(false);
  const previewSubject =
    subject.trim() || "Your email subject will appear here";
  const previewBody =
    messageHtml.trim() ||
    "Write your message on the left to see a live preview.";

  const sendCampaign = async () => {
    if (!subject.trim() || !messageHtml.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setIsSending(true);
    try {
      const res = await adminApi.sendMarketingEmail({
        subject: subject.trim(),
        messageHtml: messageHtml.trim(),
        audience,
        ctaText: ctaText.trim() || undefined,
        ctaLink: ctaLink.trim() || undefined,
      });
      toast.success(res.message || "Campaign queued successfully");
      setSubject("");
      setMessageHtml("");
      setCtaText("Shop Now");
      setCtaLink("/shop");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string }).message || "Failed to queue campaign",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-6xl mx-auto">
      <AdminPageHeader
        title="Email campaigns"
        description="One-off broadcasts to your audience — queued safely and sent with your branded template. Pair with coupons and storefront updates for launches."
        actions={
          <Link
            href="/admin/storefront"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
          >
            Storefront
            <ArrowUpRight className="h-4 w-4 text-brand-600" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 lg:gap-6">
        <div className='xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='Email subject'
                className='mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              />
            </div>
            <div>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className='mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              >
                <option value='users'>All users</option>
                <option value='admins'>Admins only</option>
                <option value='all'>Everyone</option>
              </select>
            </div>
          </div>

          <div>
            <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Message
            </label>
            <textarea
              value={messageHtml}
              onChange={(e) => setMessageHtml(e.target.value)}
              rows={8}
              placeholder='Write a beautiful message...'
              className='mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Button text (optional)
              </label>
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder='e.g. Shop Now'
                className='mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              />
            </div>
            <div>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Button link preview
              </label>
              <input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder='/shop or https://...'
                className='mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              />
            </div>
          </div>

          <div className='flex items-center justify-between gap-3'>
            <div className='text-xs text-gray-500 inline-flex items-center gap-1.5'>
              {audienceMeta[audience].icon}
              {audienceMeta[audience].label}
            </div>
            <button
              onClick={sendCampaign}
              disabled={isSending}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60'
            >
              <Send className='h-4 w-4' />
              {isSending ? "Queueing..." : "Queue Campaign"}
            </button>
          </div>
        </div>

        <div className='xl:col-span-2 space-y-5'>
          <div className='bg-white rounded-2xl border border-gray-100 p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <Sparkles className='h-4 w-4 text-brand-600' />
              <h3 className='font-semibold text-gray-900'>
                Live email preview
              </h3>
            </div>
            <div className='rounded-2xl border border-gray-200 overflow-hidden bg-[#f3f4f6] p-3'>
              <div className='max-w-xl mx-auto bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm'>
                <div className='px-4 py-3 bg-[linear-gradient(135deg,#0f172a,#1f2937)] text-white'>
                  <div className='flex items-center justify-between gap-2'>
                    <img
                      src='/logo.png'
                      alt='The House of Rani'
                      className='h-8 w-auto object-contain'
                    />
                    <span className='text-[10px] uppercase tracking-widest text-white/70 rounded-full bg-white/10 px-2 py-1'>
                      Premium Ethnic Wear
                    </span>
                  </div>
                </div>
                <div className='px-4 py-4'>
                  <p className='text-[11px] uppercase tracking-widest text-gray-400'>
                    The House of Rani
                  </p>
                  <p className='text-lg font-bold text-gray-900 leading-snug mt-1'>
                    {previewSubject}
                  </p>
                  <p className='text-sm text-gray-600 mt-3 whitespace-pre-line leading-relaxed'>
                    {previewBody}
                  </p>
                  <div className='mt-3 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2'>
                    <p className='text-[11px] text-gray-500'>
                      Curated styles, premium fabrics, reliable delivery - built
                      for a modern shopping experience.
                    </p>
                  </div>
                  <button
                    type='button'
                    className='mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold'
                  >
                    {ctaText.trim() || "Shop Now"}
                  </button>
                  <p className='text-[11px] text-gray-400 mt-2 break-all'>
                    {ctaLink.trim() || "/shop"}
                  </p>
                </div>
                <div className='px-4 py-3 border-t border-gray-100 bg-gray-50'>
                  <p className='text-[11px] text-gray-500'>
                    This mailbox is not monitored. Please do not reply to this
                    email.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Final emails use your brand wrapper from the server queue.
            </p>
          </div>

          <div className='bg-white rounded-2xl border border-gray-100 p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <Sparkles className='h-4 w-4 text-brand-600' />
              <h3 className='font-semibold text-gray-900'>Quick presets</h3>
            </div>
            <div className='space-y-2'>
              {presetMessages.map((p) => (
                <button
                  key={p.title}
                  onClick={() => {
                    setSubject(p.subject);
                    setMessageHtml(p.body);
                  }}
                  className='w-full text-left rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 px-3 py-2 transition-colors'
                >
                  <p className='text-sm font-semibold text-gray-900'>
                    {p.title}
                  </p>
                  <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>
                    {p.subject}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">Delivery:</span> campaigns are queued (Redis / BullMQ) and processed in the background — large sends won&apos;t block this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
