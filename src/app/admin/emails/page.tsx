"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  Globe2,
  ArrowUpRight,
  Bell,
  BellRing,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type Audience = "users" | "admins" | "all";
type Channel = "email" | "in_app" | "push";

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
    title: "Shipping update",
    subject: "Shipping update from our team",
    body: "We are sharing a quick update regarding dispatch timelines. Thank you for your patience.",
  },
];

const audienceMeta: Record<Audience, { icon: JSX.Element; label: string; hint: string }> = {
  users: {
    icon: <Users className="h-4 w-4" />,
    label: "Registered customers",
    hint: "Active accounts with role “user”",
  },
  admins: {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Admins only",
    hint: "Internal team accounts",
  },
  all: {
    icon: <Globe2 className="h-4 w-4" />,
    label: "Everyone active",
    hint: "All active users + admins",
  },
};

type PreviewStats = {
  accountUsers: number;
  offlineLeadEmails: number;
  estimatedEmailRecipients: number;
  estimatedNotificationRecipients: number;
  delivery: { resendConfigured: boolean; redisEnabled: boolean };
};

export default function AdminEmailsPage() {
  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/shop");
  const [audience, setAudience] = useState<Audience>("users");
  const [channels, setChannels] = useState<Channel[]>(["email"]);
  const [includeOfflineLeads, setIncludeOfflineLeads] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [stats, setStats] = useState<PreviewStats | null>(null);

  const previewSubject = subject.trim() || "Your email subject will appear here";
  const previewBody =
    messageHtml.trim() || "Write your message on the left to see a live preview.";

  const channelsKey = channels.join(",");

  const loadPreview = useCallback(async () => {
    if (channels.length === 0) {
      setStats(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await adminApi.getMarketingAudiencePreview({
        audience,
        channels: channelsKey,
        includeOfflineLeads: includeOfflineLeads && channels.includes("email"),
      });
      const d = res.data as PreviewStats;
      setStats(d);
    } catch {
      setStats(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [audience, channelsKey, includeOfflineLeads, channels]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const sendCampaign = async () => {
    if (!subject.trim() || !messageHtml.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (channels.length === 0) {
      toast.error("Select at least one delivery channel");
      return;
    }
    if (channels.includes("email") && stats && !stats.delivery.resendConfigured) {
      toast.error("Email is not configured on the server (RESEND_API_KEY). Use notifications only or configure Resend.");
      return;
    }

    const emailCount = stats?.estimatedEmailRecipients ?? 0;
    const notifCount = stats?.estimatedNotificationRecipients ?? 0;
    const totalReach = Math.max(emailCount, notifCount);

    if (totalReach > 500) {
      const ok = window.confirm(
        `You are about to reach ~${totalReach.toLocaleString()} recipient(s). Campaigns are queued in the background (emails are sent slowly to protect deliverability). Continue?`,
      );
      if (!ok) return;
    }

    setIsSending(true);
    try {
      const res = await adminApi.sendMarketingEmail({
        subject: subject.trim(),
        messageHtml: messageHtml.trim(),
        audience,
        ctaText: ctaText.trim() || undefined,
        ctaLink: ctaLink.trim() || undefined,
        channels,
        includeOfflineLeads: includeOfflineLeads && channels.includes("email"),
      });
      toast.success(res.message || "Campaign queued successfully");
      setSubject("");
      setMessageHtml("");
      setCtaText("Shop Now");
      setCtaLink("/shop");
      void loadPreview();
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
        title="Marketing campaigns"
        description="Professional broadcasts — email (Resend), in-app alerts, and browser push. Queued in the background so large sends never freeze the admin panel."
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

      {stats && !stats.delivery.resendConfigured && channels.includes("email") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>
            <strong>Email not configured:</strong> set <code className="text-xs bg-white/80 px-1 rounded">RESEND_API_KEY</code> on the server.
            In-app and browser push still work for logged-in users who allowed notifications.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 lg:gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Delivery channels
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  {
                    id: "email" as const,
                    label: "Email",
                    sub: "Branded HTML via Resend",
                    icon: Mail,
                  },
                  {
                    id: "in_app" as const,
                    label: "In-app",
                    sub: "Bell icon in dashboard",
                    icon: Bell,
                  },
                  {
                    id: "push" as const,
                    label: "Browser push",
                    sub: "Web push (if allowed)",
                    icon: BellRing,
                  },
                ] as const
              ).map((ch) => {
                const on = channels.includes(ch.id);
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={[
                      "rounded-xl border p-3 text-left transition-all",
                      on
                        ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50",
                    ].join(" ")}
                  >
                    <Icon className={`h-5 w-5 ${on ? "text-brand-600" : "text-gray-400"}`} />
                    <p className="text-sm font-semibold text-gray-900 mt-2">{ch.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{ch.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject / notification title"
                className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                <option value="users">Registered customers</option>
                <option value="admins">Admins only</option>
                <option value="all">Everyone (active)</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">{audienceMeta[audience].hint}</p>
            </div>
          </div>

          {channels.includes("email") && audience !== "admins" && (
            <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOfflineLeads}
                onChange={(e) => setIncludeOfflineLeads(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Also email <strong>offline POS leads</strong> (emails from walk-in orders without a full account yet).
              </span>
            </label>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Message
            </label>
            <textarea
              value={messageHtml}
              onChange={(e) => setMessageHtml(e.target.value)}
              rows={8}
              placeholder="Write your campaign message. Line breaks are preserved in email and notifications."
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Button text (optional)
              </label>
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Shop Now"
                className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Button link
              </label>
              <input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/shop or https://..."
                className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <p className="text-[11px] text-gray-400 mt-1">Use /shop or full https:// URL</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="text-xs text-gray-500 inline-flex items-center gap-1.5">
              {audienceMeta[audience].icon}
              {audienceMeta[audience].label}
            </div>
            <button
              type="button"
              onClick={sendCampaign}
              disabled={isSending || channels.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending ? "Queueing…" : "Send campaign"}
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Reach estimate</h3>
              {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {stats ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Active accounts</span>
                  <span className="font-semibold tabular-nums">{stats.accountUsers.toLocaleString()}</span>
                </div>
                {channels.includes("email") && includeOfflineLeads && audience !== "admins" && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Offline leads (email only)</span>
                    <span className="font-semibold tabular-nums">
                      +{stats.offlineLeadEmails.toLocaleString()}
                    </span>
                  </div>
                )}
                {channels.includes("email") && (
                  <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Emails queued</span>
                    <span className="font-bold text-brand-700 tabular-nums">
                      ~{stats.estimatedEmailRecipients.toLocaleString()}
                    </span>
                  </div>
                )}
                {(channels.includes("in_app") || channels.includes("push")) && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-700 font-medium">In-app / push</span>
                    <span className="font-bold text-navy-800 tabular-nums">
                      ~{stats.estimatedNotificationRecipients.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 leading-relaxed space-y-1">
                  <p className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Background queue {stats.delivery.redisEnabled ? "(Redis)" : "(inline)"}
                  </p>
                  <p>
                    Emails send ~10 per batch with 1–2s spacing (safe for Resend limits). 100 emails ≈ few minutes; 10,000+ runs for hours without blocking admin.
                  </p>
                  <p>
                    Browser push only reaches users who allowed notifications on the site.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Select a channel to see reach.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">Live preview</h3>
            </div>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-[#f3f4f6] p-3">
              <div className="max-w-xl mx-auto bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="px-4 py-3 bg-[linear-gradient(135deg,#0f172a,#1f2937)] text-white">
                  <div className="flex items-center justify-between gap-2">
                    <img src="/logo.png" alt="The House of Rani" className="h-8 w-auto object-contain" />
                    <span className="text-[10px] uppercase tracking-widest text-white/70 rounded-full bg-white/10 px-2 py-1">
                      Premium Ethnic Wear
                    </span>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400">The House of Rani</p>
                  <p className="text-lg font-bold text-gray-900 leading-snug mt-1">{previewSubject}</p>
                  <p className="text-sm text-gray-600 mt-3 whitespace-pre-line leading-relaxed">{previewBody}</p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold"
                  >
                    {ctaText.trim() || "Shop Now"}
                  </button>
                  <p className="text-[11px] text-gray-400 mt-2 break-all">{ctaLink.trim() || "/shop"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">Quick presets</h3>
            </div>
            <div className="space-y-2">
              {presetMessages.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => {
                    setSubject(p.subject);
                    setMessageHtml(p.body);
                  }}
                  className="w-full text-left rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 px-3 py-2 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.subject}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
