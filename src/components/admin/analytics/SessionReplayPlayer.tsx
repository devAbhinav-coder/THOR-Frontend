"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Pause } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  sessionKey: string;
};

export default function SessionReplayPlayer({ sessionKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const replayerRef = useRef<{ play: () => void; pause: () => void } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    replayerRef.current = null;
    setReady(false);
    setError(null);
    if (!sessionKey || sessionKey.length < 8) return;
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";
    setLoading(true);
    let cancelled = false;

    void (async () => {
      try {
        const res = await adminApi.getSessionReplay(sessionKey);
        const data = res.data as { events?: unknown[] };
        const events = data.events ?? [];
        if (!events.length) {
          setError(
            "No replay in the 7-day window. User must Accept all cookies, then browse ~30s.",
          );
          return;
        }
        if (cancelled) return;

        const rrwebPlayer = await import("rrweb-player");
        void import("rrweb-player/dist/style.css");

        el.innerHTML = "";
        const width = Math.min(el.clientWidth || 720, 960);
        const player = new rrwebPlayer.default({
          target: el,
          props: {
            events: events as ConstructorParameters<
              typeof rrwebPlayer.default
            >[0]["props"]["events"],
            width,
            height: Math.round(width * 0.56),
            autoPlay: false,
            showController: true,
            speed: 1,
          },
        });

        replayerRef.current = player.getReplayer();
        setReady(true);
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e ?
            String((e as { message: string }).message)
          : "Could not load replay.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [sessionKey]);

  if (!sessionKey || sessionKey.length < 8) return null;

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm font-semibold text-navy-900'>
          Session replay
        </p>
        {ready ?
          <div className='flex gap-1'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => replayerRef.current?.play()}
            >
              <Play className='h-3.5 w-3.5 mr-1' />
              Play
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => replayerRef.current?.pause()}
            >
              <Pause className='h-3.5 w-3.5 mr-1' />
              Pause
            </Button>
          </div>
        : null}
      </div>
      {loading ?
        <div className='flex items-center justify-center py-16 text-gray-500 text-xs gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Loading replay…
        </div>
      : null}
      {error ?
        <p className='text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3'>
          {error}
        </p>
      : null}
      <div
        ref={containerRef}
        className='w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 min-h-[120px]'
      />
      <p className='text-[10px] text-gray-400'>
        DOM replay · inputs masked · first-party storage (IST day buckets).
      </p>
    </div>
  );
}
