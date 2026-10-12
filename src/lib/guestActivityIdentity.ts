const EMAIL_KEY = "hor_guest_activity_email";

export function setGuestActivityEmail(email: string): void {
  if (typeof localStorage === "undefined") return;
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return;
  try {
    localStorage.setItem(EMAIL_KEY, e);
  } catch {
    /* ignore */
  }
}

export function getGuestActivityEmail(): string | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const e = localStorage.getItem(EMAIL_KEY)?.trim().toLowerCase();
    return e && e.includes("@") ? e : undefined;
  } catch {
    return undefined;
  }
}
