import { useEffect, useState } from "react";

/** True after the first client paint — use to defer localStorage/zustand-persist UI during SSR hydration. */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
