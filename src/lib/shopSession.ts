/** Browser tab session id (`hor_sv`) — shared by visit tracking, popup attribution, checkout. */
const SESSION_KEY = 'hor_sv';

export function getShopSessionKey(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID ?
        crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return null;
  }
}
