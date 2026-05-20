"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Prevents double-submit on auth forms while exposing loading state.
 */
export function useDedupeSubmit() {
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setLoading(true);
    try {
      return await fn();
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run, isBusy: loading };
}
