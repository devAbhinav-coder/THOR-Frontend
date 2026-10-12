export const GUEST_CHECKOUT_PROFILE_KEY = "hor_guest_checkout_profile_v1";

export type GuestCheckoutProfile = {
  email: string;
  name?: string;
  phone?: string;
  /** Latest guest order confirmation link token (same device). */
  confirmToken?: string;
};

export function saveGuestCheckoutProfile(profile: GuestCheckoutProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      GUEST_CHECKOUT_PROFILE_KEY,
      JSON.stringify({
        email: profile.email.trim().toLowerCase(),
        name: profile.name?.trim(),
        phone: profile.phone?.replace(/\s/g, ""),
        ...(profile.confirmToken ?
          { confirmToken: profile.confirmToken.trim() }
        : {}),
      }),
    );
  } catch {
    /* private mode / quota */
  }
}

export function readGuestCheckoutProfile(): GuestCheckoutProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_CHECKOUT_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestCheckoutProfile;
    if (!parsed?.email || typeof parsed.email !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
