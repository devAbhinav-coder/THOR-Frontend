"use client";

import { useCallback, useEffect, useState } from "react";
import { Film, Loader2, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";

export type ReplayListItem = {
  sessionKey: string;
  visitDate?: string;
  firstPath?: string;
  lastPath?: string;
  chunkCount: number;
  eventCount: number;
  userLabel: string;
  guestEmail?: string;
  lastAt?: string | Date;
};

type Props = {
  onWatchSession: (sessionKey: string) => void;
};

export default function RecentSessionReplaysSection({ onWatchSession }: Props) {
  const [loading, setLoading] = useState(true);
  const [replays, setReplays] = useState<ReplayListItem[]>([]);
  const [retentionDays, setRetentionDays] = useState(7);
  const [windowStart, setWindowStart] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSessionReplays(30);
      const data = res.data as {
        replays?: ReplayListItem[];
        retentionDays?: number;
        windowStart?: string;
      };
      setReplays(data.replays ?? []);
      if (data.retentionDays) setRetentionDays(data.retentionDays);
      setWindowStart(data.windowStart);
    } catch {
      setReplays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <AnalyticsSectionHeader
          title='Recent session replays'
          description={`DOM recordings (consent-gated) · ${retentionDays}-day retention${windowStart ? ` from ${windowStart} IST` : ""}. Click Watch to load player below.`}
        />
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ?
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          : <RefreshCw className='h-3.5 w-3.5' />}
        </Button>
      </div>

      {loading && replays.length === 0 ?
        <p className='text-xs text-gray-500 py-6 text-center flex items-center justify-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Loading replays…
        </p>
      : null}

      {!loading && replays.length === 0 ?
        <p className='text-xs text-gray-500 py-6 text-center'>
          No replays yet. Shoppers must accept cookies (Accept all), then browse
          the storefront for ~30s.
        </p>
      : null}

      {replays.length > 0 ?
        <div className='overflow-x-auto'>
          <table className='w-full text-[10px]'>
            <thead>
              <tr className='text-left text-gray-400 border-b border-gray-100'>
                <th className='py-2 pr-2'>Last active</th>
                <th className='py-2 pr-2'>Journey</th>
                <th className='py-2 pr-2'>Events</th>
                <th className='py-2 pr-2'>User</th>
                <th className='py-2'>Action</th>
              </tr>
            </thead>
            <tbody>
              {replays.map((r) => (
                <tr
                  key={`${r.sessionKey}-${r.visitDate ?? ""}`}
                  className='border-b border-gray-50 align-top'
                >
                  <td className='py-1.5 pr-2 tabular-nums text-gray-500 whitespace-nowrap'>
                    {r.lastAt ?
                      formatDateTime(
                        r.lastAt instanceof Date ?
                          r.lastAt.toISOString()
                        : String(r.lastAt),
                      )
                    : "—"}
                  </td>
                  <td className='py-1.5 pr-2 text-gray-700 max-w-[200px] truncate'>
                    {r.firstPath || "/"}
                    {r.lastPath && r.lastPath !== r.firstPath ?
                      ` → ${r.lastPath}`
                    : ""}
                  </td>
                  <td className='py-1.5 pr-2 tabular-nums'>
                    {r.eventCount.toLocaleString()} · {r.chunkCount} chunks
                  </td>
                  <td className='py-1.5 pr-2 text-gray-600'>
                    {r.guestEmail ?
                      <span className='truncate block max-w-[120px]'>
                        {r.guestEmail}
                      </span>
                    : r.userLabel}
                  </td>
                  <td className='py-1.5'>
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      className='h-7 text-[10px]'
                      onClick={() => onWatchSession(r.sessionKey)}
                    >
                      <Film className='h-3 w-3 mr-1' />
                      Watch
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      : null}
    </div>
  );
}
