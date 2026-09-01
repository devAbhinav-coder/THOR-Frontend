"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Send,
  Clock,
  Users,
  Zap,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

type WhatsAppStatus = {
  enabled: boolean;
  configured: boolean;
  marketingEnabled: boolean;
  redisEnabled: boolean;
  phoneNumberId: string | null;
  graphVersion: string;
  language: string;
  templates: Array<{
    key: string;
    label: string;
    configured: boolean;
    templateName: string | null;
  }>;
  automatedTriggers: Array<{
    id: string;
    label: string;
    templateKey: string;
    schedule: string;
    templateConfigured: boolean;
  }>;
  audience: {
    usersWithPhone: number;
    marketingOptIn: number;
  };
  stats: {
    today: { sent: number; failed: number; queued: number; total: number };
    allTime: { sent: number; failed: number; queued: number; total: number };
  };
  queue: {
    waiting: number;
    active: number;
    failed: number;
    completed: number;
  } | null;
};

type WhatsAppLog = {
  _id: string;
  to: string;
  template: string;
  category: string;
  status: "queued" | "sent" | "failed";
  errorMessage?: string;
  campaignSubject?: string;
  createdAt: string;
  sentAt?: string;
};

const categoryLabels: Record<string, string> = {
  order_confirm: "Order confirmed",
  order_shipped: "Shipped",
  order_delivered: "Delivered",
  offline_thankyou: "Offline thank-you",
  offline_handover: "Handover + invoice",
  abandoned_cart: "Abandoned cart",
  review_invite: "Review invite",
  catalog_alert: "Catalog alert",
  marketing_campaign: "Marketing",
  test: "Test",
  other: "Other",
};

export default function AdminWhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<"" | "sent" | "failed" | "queued">("");
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        adminApi.getWhatsAppStatus(),
        adminApi.getWhatsAppLogs({
          limit: 60,
          status: logFilter || undefined,
        }),
      ]);
      setStatus(statusRes.data as WhatsAppStatus);
      setLogs((logsRes.data as { logs: WhatsAppLog[] }).logs || []);
    } catch {
      toast.error("Could not load WhatsApp dashboard");
    } finally {
      setLoading(false);
    }
  }, [logFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    setTestSending(true);
    try {
      const res = await adminApi.sendWhatsAppTest({ phone: testPhone.trim() });
      toast.success(res.message || "Test sent");
      void load();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || "Test failed");
    } finally {
      setTestSending(false);
    }
  };

  const configuredTemplates =
    status?.templates.filter((t) => t.configured).length ?? 0;
  const totalTemplates = status?.templates.length ?? 0;

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-6xl mx-auto">
      <AdminPageHeader
        title="WhatsApp Business"
        description="Meta Cloud API — automated order updates, review invites, cart recovery, and marketing broadcasts. Same professional touch as email."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Link
              href="/admin/emails"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              Marketing campaigns
              <ArrowUpRight className="h-4 w-4 text-brand-600" />
            </Link>
          </div>
        }
      />

      {!loading && status && !status.configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>
            <strong>WhatsApp not configured.</strong> Set{" "}
            <code className="text-xs bg-white/80 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> and{" "}
            <code className="text-xs bg-white/80 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> on
            the server. Templates must be approved in Meta WhatsApp Manager.
          </p>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Connection",
              value: status.enabled ? "Live" : status.configured ? "Disabled" : "Not set up",
              sub: status.phoneNumberId ? `ID ${status.phoneNumberId}` : "No credentials",
              tone: status.enabled ? "text-emerald-700" : "text-amber-700",
              icon: MessageCircle,
            },
            {
              label: "Sent today",
              value: status.stats.today.sent.toLocaleString(),
              sub: `${status.stats.today.failed} failed`,
              tone: "text-brand-700",
              icon: CheckCircle2,
            },
            {
              label: "Queue",
              value: status.queue ?
                `${status.queue.waiting + status.queue.active}`
              : "Inline",
              sub: status.queue ? `${status.queue.failed} failed jobs` : "No Redis queue",
              tone: "text-navy-800",
              icon: Clock,
            },
            {
              label: "Reach",
              value: status.audience.marketingOptIn.toLocaleString(),
              sub: `${status.audience.usersWithPhone} with phone`,
              tone: "text-violet-700",
              icon: Users,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {card.label}
                  </p>
                  <Icon className="h-4 w-4 text-gray-300" />
                </div>
                <p className={cn("text-2xl font-bold tabular-nums mt-1", card.tone)}>
                  {card.value}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 lg:gap-6">
        <div className="xl:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">Automated messages</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              These send automatically — like email. Create matching templates in Meta WhatsApp
              Manager with the env names below.
            </p>
            <div className="space-y-2">
              {status?.automatedTriggers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{t.schedule}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      t.templateConfigured ?
                        "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {t.templateConfigured ?
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </>
                    : <>
                        <AlertTriangle className="h-3 w-3" /> Template missing
                      </>
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-gray-900">Recent delivery log</h3>
              <div className="flex gap-1">
                {(["", "sent", "failed", "queued"] as const).map((f) => (
                  <button
                    key={f || "all"}
                    type="button"
                    onClick={() => setLogFilter(f)}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition-colors",
                      logFilter === f ?
                        "bg-brand-100 text-brand-800"
                      : "text-gray-500 hover:bg-gray-100",
                    )}
                  >
                    {f || "All"}
                  </button>
                ))}
              </div>
            </div>

            {loading ?
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
              </div>
            : logs.length === 0 ?
              <p className="text-sm text-gray-400 py-6 text-center">No messages yet.</p>
            : <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-3 font-semibold">Time</th>
                      <th className="pb-2 pr-3 font-semibold">Type</th>
                      <th className="pb-2 pr-3 font-semibold">To</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <tr key={log._id} className="align-top">
                        <td className="py-2.5 pr-3 text-[11px] text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-gray-800 text-xs">
                            {categoryLabels[log.category] || log.category}
                          </p>
                          {log.campaignSubject ?
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                              {log.campaignSubject}
                            </p>
                          : null}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-gray-600">
                          …{log.to.slice(-4)}
                        </td>
                        <td className="py-2.5">
                          {log.status === "sent" ?
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                            </span>
                          : log.status === "failed" ?
                            <span className="inline-flex items-start gap-1 text-red-600 text-xs">
                              <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 max-w-[160px]">
                                {log.errorMessage || "Failed"}
                              </span>
                            </span>
                          : <span className="text-amber-700 text-xs font-semibold">Queued</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            {status && (
              <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
                All-time: {status.stats.allTime.sent.toLocaleString()} sent ·{" "}
                {status.stats.allTime.failed.toLocaleString()} failed · Templates{" "}
                {configuredTemplates}/{totalTemplates} configured
              </p>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Meta templates</h3>
            </div>
            <div className="space-y-2">
              {status?.templates.map((t) => (
                <div
                  key={t.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{t.label}</p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      {t.templateName || `WHATSAPP_TEMPLATE_${t.key}`}
                    </p>
                  </div>
                  {t.configured ?
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-4 w-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900">Send test message</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Uses the catalog template. Enter a 10-digit Indian mobile number.
            </p>
            <input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="9876543210"
              className="h-10 w-full px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 mb-3"
            />
            <Button
              variant="brand"
              className="w-full rounded-xl"
              loading={testSending}
              disabled={!status?.enabled}
              onClick={() => void sendTest()}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Send test WhatsApp
            </Button>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-sm text-emerald-900 space-y-2">
            <p className="font-semibold">Marketing broadcasts</p>
            <p className="text-xs leading-relaxed text-emerald-800/90">
              Go to{" "}
              <Link href="/admin/emails" className="underline font-semibold">
                Email campaigns
              </Link>{" "}
              and enable the <strong>WhatsApp</strong> channel. Uses the catalog template with
              your subject + link — same audience as email (opted-in users with phone).
            </p>
            <p className="text-xs leading-relaxed text-emerald-800/90">
              Review invites: use the WhatsApp button on any order&apos;s review QR panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
