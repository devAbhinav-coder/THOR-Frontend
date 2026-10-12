"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  UserRound,
  Mail,
  KeyRound,
  Copy,
  Check,
  History,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";
import SessionReplayPlayer from "./SessionReplayPlayer";

type TimelineEvent = {
  kind: "commerce" | "page" | "meta" | "ga" | "pageview";
  at: string;
  title: string;
  detail: string;
  meta?: string;
  sessionKey?: string;
};

type VisitorIdentity = {
  sessionKey?: string;
  sessionKeys?: string[];
  guestEmail?: string;
  userId?: string;
};

type RecentSession = {
  sessionKey: string;
  lastPath: string;
  lastAt: string | Date;
  userId?: string;
  guestEmail?: string;
  userLabel: string;
  pageViews: number;
};

const KIND_STYLE: Record<
  TimelineEvent["kind"],
  { label: string; className: string }
> = {
  commerce: {
    label: "Shop",
    className: "bg-emerald-50 text-emerald-800",
  },
  page: {
    label: "Dwell",
    className: "bg-amber-50 text-amber-900",
  },
  meta: {
    label: "Meta",
    className: "bg-indigo-50 text-indigo-800",
  },
  pageview: {
    label: "View",
    className: "bg-sky-50 text-sky-800",
  },
  ga: {
    label: "GA4",
    className: "bg-violet-50 text-violet-800",
  },
};

function CopyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) {
    return (
      <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-2.5'>
        <p className='text-[10px] font-bold uppercase text-gray-400'>{label}</p>
        <p className='text-xs text-gray-400 mt-1'>Not linked yet</p>
      </div>
    );
  }
  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50/80 p-2.5'>
      <p className='text-[10px] font-bold uppercase text-gray-500'>{label}</p>
      <div className='flex items-start gap-1.5 mt-1'>
        <p
          className={`text-xs text-gray-800 flex-1 break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
        <button
          type='button'
          className='shrink-0 p-1 rounded hover:bg-gray-200 text-gray-500'
          title='Copy'
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ?
            <Check className='h-3.5 w-3.5 text-emerald-600' />
          : <Copy className='h-3.5 w-3.5' />}
        </button>
      </div>
    </div>
  );
}

export type VisitorExplorerInitial = {
  sessionKey?: string;
  email?: string;
  userId?: string;
  autoLoad?: boolean;
};

type Props = {
  presetSessionKey?: string;
  initialSearch?: VisitorExplorerInitial;
};

function applyIdentityToForm(
  identity: VisitorIdentity | undefined,
  setters: {
    setSessionKey: (v: string) => void;
    setEmail: (v: string) => void;
    setUserId: (v: string) => void;
  },
) {
  if (!identity) return;
  if (identity.sessionKey) setters.setSessionKey(identity.sessionKey);
  if (identity.guestEmail) setters.setEmail(identity.guestEmail);
  if (identity.userId) setters.setUserId(identity.userId);
}

export default function VisitorSessionExplorer({
  presetSessionKey,
  initialSearch,
}: Props) {
  const [sessionKey, setSessionKey] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [identity, setIdentity] = useState<VisitorIdentity | null>(null);
  const [hasReplay, setHasReplay] = useState(false);
  const [replayKey, setReplayKey] = useState("");
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const autoLoadedRef = useRef(false);

  const loadRecentSessions = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await adminApi.listVisitorSessions(30);
      const data = res.data as { sessions?: RecentSession[] };
      setRecentSessions(data.sessions ?? []);
    } catch {
      setRecentSessions([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentSessions();
  }, [loadRecentSessions]);

  const applyTimelineResponse = useCallback(
    (data: {
      events?: TimelineEvent[];
      identity?: VisitorIdentity;
      sessionKey?: string;
      guestEmail?: string;
      userId?: string;
      hasReplay?: boolean;
    }) => {
      const mapped = (data.events ?? []).map((ev) => ({
        ...ev,
        at: String(ev.at),
      }));
      setEvents(mapped);

      const id: VisitorIdentity = data.identity ?? {
        sessionKey: data.sessionKey,
        guestEmail: data.guestEmail,
        userId: data.userId,
        sessionKeys: data.sessionKey ? [data.sessionKey] : [],
      };
      setIdentity(id);
      applyIdentityToForm(id, { setSessionKey, setEmail, setUserId });

      const effectiveKey =
        id.sessionKey ||
        id.sessionKeys?.[0] ||
        mapped.find((e) => e.sessionKey && e.sessionKey.length >= 8)
          ?.sessionKey ||
        "";
      setReplayKey(effectiveKey.length >= 8 ? effectiveKey : "");
      setHasReplay(Boolean(data.hasReplay));
    },
    [],
  );

  const runSearch = useCallback(
    async (override?: {
      sessionKey?: string;
      email?: string;
      userId?: string;
    }) => {
      const sk = (override?.sessionKey ?? sessionKey).trim();
      const em = (override?.email ?? email).trim().toLowerCase();
      const uid = (override?.userId ?? userId).trim();
      if (sk.length < 8 && !em && !uid) {
        setError("Pick a recent session below, or enter session key, email, or user id.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getVisitorActivity({
          sessionKey: sk.length >= 8 ? sk : undefined,
          email: em || undefined,
          userId: uid || undefined,
        });
        applyTimelineResponse(res.data as Parameters<typeof applyTimelineResponse>[0]);
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e ?
            String((e as { message: string }).message)
          : "Could not load visitor activity.";
        setError(msg);
        setEvents([]);
        setIdentity(null);
        setReplayKey("");
      } finally {
        setLoading(false);
      }
    },
    [applyTimelineResponse, email, sessionKey, userId],
  );

  const openRecentSession = useCallback(
    (row: RecentSession) => {
      setSessionKey(row.sessionKey);
      setEmail(row.guestEmail ?? "");
      setUserId(row.userId ?? "");
      void runSearch({
        sessionKey: row.sessionKey,
        email: row.guestEmail,
        userId: row.userId,
      });
    },
    [runSearch],
  );

  useEffect(() => {
    const sk = presetSessionKey?.trim() ?? "";
    if (sk.length < 8) return;
    void runSearch({ sessionKey: sk });
  }, [presetSessionKey, runSearch]);

  useEffect(() => {
    if (autoLoadedRef.current || !initialSearch?.autoLoad) return;
    const sk = initialSearch.sessionKey?.trim() ?? "";
    const em = initialSearch.email?.trim() ?? "";
    const uid = initialSearch.userId?.trim() ?? "";
    if (sk.length < 8 && !em && !uid) return;
    autoLoadedRef.current = true;
    if (sk) setSessionKey(sk);
    if (em) setEmail(em);
    if (uid) setUserId(uid);
    void runSearch({
      sessionKey: sk.length >= 8 ? sk : undefined,
      email: em || undefined,
      userId: uid || undefined,
    });
  }, [initialSearch, runSearch]);

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4'>
      <AnalyticsSectionHeader
        title='Visitor session explorer'
        description='Admin does not need DevTools: pick a recent session or search by any one of session key · guest email · user id — we merge the full journey (page views, dwell, cart, Meta, GA4, purchases).'
      />

      <div className='rounded-lg border border-brand-200/60 bg-brand-50/40 p-3 space-y-2'>
        <p className='text-[10px] font-bold uppercase text-brand-900/80 flex items-center gap-1.5'>
          <History className='h-3.5 w-3.5' />
          Recent live sessions (last 7 days)
        </p>
        {recentLoading ?
          <p className='text-xs text-gray-500 py-2 flex items-center gap-2'>
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
            Loading sessions…
          </p>
        : recentSessions.length === 0 ?
          <p className='text-xs text-gray-500'>
            Sessions appear when shoppers browse the storefront (visit tracking).
          </p>
        : <div className='overflow-x-auto max-h-36 overflow-y-auto'>
            <table className='w-full text-[10px]'>
              <thead>
                <tr className='text-left text-gray-400'>
                  <th className='py-1 pr-2'>When</th>
                  <th className='py-1 pr-2'>Last page</th>
                  <th className='py-1 pr-2'>Who</th>
                  <th className='py-1'>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((row) => (
                  <tr key={row.sessionKey} className='border-t border-white/80'>
                    <td className='py-1.5 pr-2 tabular-nums text-gray-500 whitespace-nowrap'>
                      {formatDateTime(
                        row.lastAt instanceof Date ?
                          row.lastAt.toISOString()
                        : String(row.lastAt),
                      )}
                    </td>
                    <td className='py-1.5 pr-2 text-gray-700 truncate max-w-[140px]'>
                      {row.lastPath}
                    </td>
                    <td className='py-1.5 pr-2 text-gray-600'>
                      {row.guestEmail ?
                        <span className='truncate block max-w-[120px]'>
                          {row.guestEmail}
                        </span>
                      : row.userLabel}
                    </td>
                    <td className='py-1.5'>
                      <Button
                        type='button'
                        size='sm'
                        variant='secondary'
                        className='h-7 text-[10px]'
                        onClick={() => openRecentSession(row)}
                      >
                        Load journey
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
        <div className='relative'>
          <KeyRound className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs font-mono'
            placeholder='Session key (hor_sv) — optional if email/user set'
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
          />
        </div>
        <div className='relative'>
          <Mail className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs'
            placeholder='Guest / account email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='relative'>
          <UserRound className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs font-mono'
            placeholder='User Mongo id'
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={() => void runSearch()}
          disabled={loading}
        >
          {loading ?
            <Loader2 className='h-4 w-4 animate-spin mr-1.5' />
          : <Search className='h-4 w-4 mr-1.5' />}
          Load timeline
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => void loadRecentSessions()}
          disabled={recentLoading}
        >
          Refresh sessions
        </Button>
      </div>

      {identity ?
        <div className='space-y-2'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Resolved visitor (auto-linked)
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            <CopyField
              label='Session key · hor_sv'
              value={identity.sessionKey ?? ""}
              mono
            />
            <CopyField label='Email' value={identity.guestEmail ?? ""} />
            <CopyField label='User id' value={identity.userId ?? ""} mono />
          </div>
          {identity.sessionKeys && identity.sessionKeys.length > 1 ?
            <p className='text-[10px] text-gray-400'>
              Merged {identity.sessionKeys.length} session keys for this shopper
              (multi-tab / return visits).
            </p>
          : null}
          {identity.userId ?
            <Link
              href={`/admin/users?highlight=${encodeURIComponent(identity.userId)}`}
              className='text-[10px] text-brand-700 hover:underline'
            >
              Open customer in Users →
            </Link>
          : null}
          {hasReplay ?
            <p className='text-[10px] text-emerald-700'>
              Session replay available for primary key.
            </p>
          : null}
        </div>
      : null}

      {error ?
        <p className='text-xs text-red-600'>{error}</p>
      : null}

      {!loading && events.length === 0 && identity ?
        <p className='text-xs text-gray-500 py-6 text-center'>
          Identity matched but no timeline rows yet — try after cart/checkout
          activity.
        </p>
      : null}

      {events.length > 0 ?
        <div className='overflow-x-auto max-h-[420px] overflow-y-auto border border-gray-100 rounded-lg'>
          <table className='w-full text-[10px]'>
            <thead className='sticky top-0 bg-gray-50'>
              <tr className='text-left text-gray-500 border-b border-gray-100'>
                <th className='py-2 px-2'>When</th>
                <th className='py-2 px-2'>Type</th>
                <th className='py-2 px-2'>Event</th>
                <th className='py-2 px-2'>Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, idx) => {
                const style = KIND_STYLE[ev.kind] ?? KIND_STYLE.commerce;
                return (
                  <tr
                    key={`${ev.at}-${idx}`}
                    className='border-b border-gray-50 align-top'
                  >
                    <td className='py-1.5 px-2 tabular-nums text-gray-500 whitespace-nowrap'>
                      {formatDateTime(ev.at)}
                    </td>
                    <td className='py-1.5 px-2'>
                      <span
                        className={`uppercase font-bold text-[9px] px-1.5 py-0.5 rounded ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className='py-1.5 px-2 font-medium text-gray-800'>
                      {ev.title}
                    </td>
                    <td className='py-1.5 px-2 text-gray-600'>
                      {ev.detail}
                      {ev.meta ?
                        <span className='text-gray-400'> · {ev.meta}</span>
                      : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      : null}

      {replayKey ?
        <SessionReplayPlayer sessionKey={replayKey} />
      : null}
    </div>
  );
}
