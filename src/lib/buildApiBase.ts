const BUILD_API_PROBE_TIMEOUT_MS = 1200;

let buildProbePromise: Promise<string | null> | null = null;

function normalizeBase(raw?: string | null): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

/**
 * Returns API base URL for server-side data fetching.
 * During `next build`, it probes the API once; if unreachable, returns null
 * so routes can gracefully fallback instead of emitting repeated ECONNREFUSED.
 */
export async function getBuildSafeApiBase(): Promise<string | null> {
  const base = normalizeBase(process.env.NEXT_PUBLIC_API_URL);
  if (!base) return null;
  if (!isBuildPhase()) return base;
  if (buildProbePromise) return buildProbePromise;

  buildProbePromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BUILD_API_PROBE_TIMEOUT_MS);
      const healthUrl = `${base}/health`;
      const res = await fetch(healthUrl, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok ? base : null;
    } catch {
      return null;
    }
  })();

  return buildProbePromise;
}

