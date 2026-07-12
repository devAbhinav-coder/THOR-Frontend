"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getVoiceSearchSnapshot,
  startVoiceSearch,
  stopVoiceSearch,
  subscribeVoiceSearch,
} from "@/lib/voiceSearchController";

export { isVoiceSearchSupported } from "@/lib/voiceSearchController";

type Options = {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
};

export function useVoiceSearch({
  lang = "en-IN",
  onResult,
  onError,
}: Options) {
  const snapshot = useSyncExternalStore(
    subscribeVoiceSearch,
    getVoiceSearchSnapshot,
    () => ({
      active: false,
      status: "idle" as const,
      statusMessage: null,
      interimTranscript: "",
    }),
  );

  const start = useCallback(() => {
    startVoiceSearch(lang, { onResult, onError });
  }, [lang, onResult, onError]);

  const stop = useCallback(() => {
    stopVoiceSearch();
  }, []);

  return {
    active: snapshot.active,
    status: snapshot.status,
    statusMessage: snapshot.statusMessage,
    interimTranscript: snapshot.interimTranscript,
    start,
    stop,
  };
}
