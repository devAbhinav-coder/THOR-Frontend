"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, UserRound, Mail, KeyRound } from "lucide-react";
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

type Props = {
  /** Set from Recent replays → Watch */
  presetSessionKey?: string;
};

export default function VisitorSessionExplorer({ presetSessionKey }: Props) {
  const [sessionKey, setSessionKey] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [resolved, setResolved] = useState<{
    sessionKey?: string;
    guestEmail?: string;
    userId?: string;
    hasReplay?: boolean;
  } | null>(null);
  const [replayKey, setReplayKey] = useState("");

  const runSearch = useCallback(async () => {
    const sk = sessionKey.trim();
    const em = email.trim().toLowerCase();
    const uid = userId.trim();
    if (sk.length < 8 && !em && !uid) {
      setError("Enter session key (8+ chars), guest email, or user id.");
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
      const data = res.data as {
        events?: TimelineEvent[];
        sessionKey?: string;
        guestEmail?: string;
        userId?: string;
        hasReplay?: boolean;
      };
      const mapped = (data.events ?? []).map((ev) => ({
        ...ev,
        at: String(ev.at),
      }));
      setEvents(mapped);
      const skFromEvents = mapped.find(
        (e) => e.sessionKey && e.sessionKey.length >= 8,
      )?.sessionKey;
      const effectiveKey =
        (sk.length >= 8 ? sk : data.sessionKey) || skFromEvents || "";
      setReplayKey(effectiveKey.length >= 8 ? effectiveKey : "");
      setResolved({
        sessionKey: data.sessionKey ?? (sk.length >= 8 ? sk : undefined),
        guestEmail: data.guestEmail,
        userId: data.userId,
        hasReplay: data.hasReplay,
      });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e ?
          String((e as { message: string }).message)
        : "Could not load visitor activity.";
      setError(msg);
      setEvents([]);
      setResolved(null);
      setReplayKey("");
    } finally {
      setLoading(false);
    }
  }, [email, sessionKey, userId]);

  useEffect(() => {
    const sk = presetSessionKey?.trim() ?? "";
    if (sk.length < 8) return;
    setSessionKey(sk);
    setReplayKey(sk);
    setEmail("");
    setUserId("");
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getVisitorActivity({ sessionKey: sk });
        const data = res.data as {
          events?: TimelineEvent[];
          sessionKey?: string;
          guestEmail?: string;
          userId?: string;
          hasReplay?: boolean;
        };
        const mapped = (data.events ?? []).map((ev) => ({
          ...ev,
          at: String(ev.at),
        }));
        setEvents(mapped);
        setResolved({
          sessionKey: data.sessionKey ?? sk,
          guestEmail: data.guestEmail,
          userId: data.userId,
          hasReplay: data.hasReplay,
        });
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e ?
            String((e as { message: string }).message)
          : "Could not load visitor activity.";
        setError(msg);
        setEvents([]);
        setResolved({ sessionKey: sk, hasReplay: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [presetSessionKey]);

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4'>
      <AnalyticsSectionHeader
        title='Visitor session explorer'
        description='Full journey for guests and logged-in shoppers: page views, time on page, cart/wishlist/checkout, Meta mirror, and purchases. Match by browser session key, checkout email, or user id.'
      />

      <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
        <div className='relative'>
          <KeyRound className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs'
            placeholder='Session key (sessionStorage hor_sv)'
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
          />
        </div>
        <div className='relative'>
          <Mail className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs'
            placeholder='Guest email (after checkout OTP)'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='relative'>
          <UserRound className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 text-xs'
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
        {resolved ?
          <p className='text-[10px] text-gray-500'>
            {resolved.guestEmail ?
              <>Email: {resolved.guestEmail}</>
            : null}
            {resolved.sessionKey ?
              <>
                {resolved.guestEmail ? " · " : ""}
                Session: {resolved.sessionKey.slice(0, 12)}…
              </>
            : null}
            {resolved.userId ?
              <>
                {" · "}
                User: {resolved.userId}
              </>
            : null}
          </p>
        : null}
      </div>

      {error ?
        <p className='text-xs text-red-600'>{error}</p>
      : null}

      {!loading && events.length === 0 && resolved ?
        <p className='text-xs text-gray-500 py-6 text-center'>
          No events matched. Try another session key or email from a recent
          checkout.
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
