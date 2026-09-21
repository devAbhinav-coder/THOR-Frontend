import type { User } from "@/types";

type DirectoryUser = User & {
  displayEmail?: string | null;
  displayPhone?: string | null;
  isPosGuest?: boolean;
};

function syntheticEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return (
    e.endsWith("@offline.local") ||
    e.endsWith("@review.local") ||
    e.endsWith("@pos.lead.local")
  );
}

/** Second line under customer name (email, or phone for offline-only profiles). */
export function directoryCustomerSubtitle(user: DirectoryUser): string {
  if (user.displayEmail) return user.displayEmail;
  const raw = user.email?.trim() ?? "";
  if (raw && !syntheticEmail(raw)) return raw;
  const phone = directoryCustomerPhone(user);
  if (phone && (user.isPosGuest || syntheticEmail(raw))) {
    return phone;
  }
  if (user.isPosGuest || syntheticEmail(raw)) {
    return "Offline sale · no email";
  }
  return phone ?? "No email";
}

export function directoryCustomerPhone(user: DirectoryUser): string | null {
  if (user.displayPhone) return user.displayPhone;
  const d = String(user.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
