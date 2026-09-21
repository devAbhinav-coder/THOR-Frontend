/** Valid http(s) or same-origin avatar URL. */
export function isUsableAvatarUrl(url?: string | null): string | null {
  const t = url?.trim();
  if (!t || t === "null" || t === "undefined") return null;
  if (/^https?:\/\//i.test(t) || t.startsWith("/")) return t;
  return null;
}

export function profileInitial(name?: string | null): string {
  const n = (name || "").trim();
  if (!n) return "?";
  const ch = n.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}
