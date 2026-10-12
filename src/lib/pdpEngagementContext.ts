const KEY = "hor_pdp_engagement_ctx";

export function setPdpEngagementContext(name: string, slug: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ name, slug }));
  } catch {
    /* ignore */
  }
}

export function readPdpEngagementContext(): {
  name?: string;
  slug?: string;
} {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as { name?: string; slug?: string };
  } catch {
    return {};
  }
}

export function clearPdpEngagementContext(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
