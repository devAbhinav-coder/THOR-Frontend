"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Mic, Search } from "lucide-react";
import {
  getLastVoiceLang,
  getLastVoiceSearchCallbacks,
  getVoiceSearchSnapshot,
  startVoiceSearch,
  stopVoiceSearch,
  submitTypedVoiceQuery,
  subscribeVoiceSearch,
} from "@/lib/voiceSearchController";
import { cn } from "@/lib/utils";

const DEFAULT_SNAPSHOT = {
  active: false,
  status: "idle" as const,
  statusMessage: null,
  interimTranscript: "",
};

export default function VoiceSearchOverlay() {
  const snapshot = useSyncExternalStore(
    subscribeVoiceSearch,
    getVoiceSearchSnapshot,
    () => DEFAULT_SNAPSHOT,
  );

  const [typed, setTyped] = useState("");

  if (!snapshot.active || typeof document === "undefined") return null;

  const handleTypedSearch = () => {
    submitTypedVoiceQuery(typed);
    setTyped("");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
      onClick={() => stopVoiceSearch()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#c5a059]/30 bg-[#1a2b48] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            snapshot.status === "error" ? "bg-red-500/20" : "bg-red-500/15",
          )}
        >
          <Mic
            className={cn(
              "h-8 w-8",
              snapshot.status === "error" ? "text-red-400" : "animate-pulse text-red-400",
            )}
            aria-hidden
          />
        </div>
        <p className="text-center font-serif text-lg text-white">
          {snapshot.status === "starting" ? "Starting…"
          : snapshot.status === "error" ? "Voice search"
          : "Listening…"}
        </p>
        <p
          className={cn(
            "mt-2 text-center text-sm leading-relaxed",
            snapshot.status === "error" ? "text-red-300" : "text-white/60",
          )}
        >
          {snapshot.statusMessage ??
            (snapshot.status === "starting" ?
              "Speak when Listening appears."
            : "Say: red saree under 5000, salwar suit…")}
        </p>
        {snapshot.interimTranscript ?
          <p className="mt-4 rounded-lg bg-white/10 px-4 py-3 text-center text-sm text-[#c5a059]">
            {snapshot.interimTranscript}
          </p>
        : null}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTypedSearch();
            }}
            placeholder="Or type search here…"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#c5a059]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleTypedSearch}
            className="flex shrink-0 items-center justify-center rounded-lg bg-[#c5a059] px-3 text-[#1a2b48]"
            aria-label="Search typed query"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {snapshot.status === "error" ?
            <button
              type="button"
              onClick={() => {
                const cbs = getLastVoiceSearchCallbacks();
                if (cbs) startVoiceSearch(getLastVoiceLang(), cbs);
              }}
              className="flex-1 rounded-lg bg-[#c5a059] py-2.5 text-sm font-medium text-[#1a2b48]"
            >
              Try again
            </button>
          : null}
          <button
            type="button"
            onClick={() => stopVoiceSearch()}
            className={cn(
              "rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10",
              snapshot.status === "error" ? "flex-1" : "w-full",
            )}
          >
            {snapshot.status === "error" ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
