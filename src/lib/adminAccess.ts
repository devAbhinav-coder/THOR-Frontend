/** Mirrors backend `adminAccess` - keep in sync when adding areas. */
export const ADMIN_ACCESS_AREAS = [
  "overview",
  "catalog",
  "storefront",
  "sales",
  "marketing",
  "customers",
  "system",
] as const;

export type AdminAccessArea = (typeof ADMIN_ACCESS_AREAS)[number];

export const ADMIN_ACCESS_AREA_LABELS: Record<AdminAccessArea, string> = {
  overview: "Overview",
  catalog: "Catalog",
  storefront: "Storefront",
  sales: "Sales",
  marketing: "Marketing & content",
  customers: "Customers & trust",
  system: "System",
};

export const ADMIN_ACCESS_AREA_DESCRIPTIONS: Record<AdminAccessArea, string> = {
  overview: "Dashboard, analytics, revenue, costs, Business Assistant",
  catalog: "Categories, products, inventory, premium",
  storefront: "Homepage, hero, and shop-facing settings",
  sales: "Orders, returns, GST invoices, coupons, offers",
  marketing: "Blogs, email, WhatsApp, newsletter, customer stories",
  customers: "User directory and product reviews",
  system: "Security audit, background jobs, outbox",
};

export const ADMIN_ACCESS_PRESET_MARKETING: AdminAccessArea[] = [
  "storefront",
  "marketing",
];

export type UserLike = {
  role?: string;
  adminPermissions?: string[];
};

export function normalizeAdminPermissions(raw: unknown): AdminAccessArea[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<AdminAccessArea>();
  for (const item of raw) {
    if (
      typeof item === "string" &&
      (ADMIN_ACCESS_AREAS as readonly string[]).includes(item)
    ) {
      set.add(item as AdminAccessArea);
    }
  }
  return ADMIN_ACCESS_AREAS.filter((a) => set.has(a));
}

export function isAdminPanelUser(user: UserLike | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "staff") return false;
  return normalizeAdminPermissions(user.adminPermissions).length > 0;
}

export function userHasAdminArea(
  user: UserLike | null | undefined,
  area: AdminAccessArea,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "staff") return false;
  return normalizeAdminPermissions(user.adminPermissions).includes(area);
}

/** Admin UI route → required area (`admin_only` = full admin). */
export function adminAreaForAdminHref(
  href: string,
): AdminAccessArea | "admin_only" {
  const p = href.endsWith("/") && href.length > 1 ? href.slice(0, -1) : href;

  if (p === "/admin/users") return "admin_only";

  if (p === "/admin" || p.startsWith("/admin/ai")) return "overview";
  if (p.startsWith("/admin/analytics") || p.startsWith("/admin/revenue")) {
    return "overview";
  }
  if (p.startsWith("/admin/expenses")) return "overview";

  if (
    p.startsWith("/admin/categories") ||
    p.startsWith("/admin/subcategories") ||
    p.startsWith("/admin/products") ||
    p.startsWith("/admin/inventory") ||
    p.startsWith("/admin/premium")
  ) {
    return "catalog";
  }
  if (p.startsWith("/admin/storefront")) return "storefront";

  if (
    p.startsWith("/admin/orders") ||
    p.startsWith("/admin/invoices") ||
    p.startsWith("/admin/returns") ||
    p.startsWith("/admin/coupons") ||
    p.startsWith("/admin/promotions") ||
    p.startsWith("/admin/sales")
  ) {
    return "sales";
  }

  if (
    p.startsWith("/admin/testimonials") ||
    p.startsWith("/admin/emails") ||
    p.startsWith("/admin/whatsapp") ||
    p.startsWith("/admin/newsletter") ||
    p.startsWith("/admin/blogs")
  ) {
    return "marketing";
  }

  if (p.startsWith("/admin/reviews")) return "customers";

  if (p.startsWith("/admin/security") || p.startsWith("/admin/system")) {
    return "system";
  }

  return "admin_only";
}

export function canAccessAdminHref(
  user: UserLike | null | undefined,
  href: string,
): boolean {
  if (!isAdminPanelUser(user)) return false;
  if (user!.role === "admin") return true;
  const area = adminAreaForAdminHref(href);
  if (area === "admin_only") return false;
  return userHasAdminArea(user, area);
}

const ORDERED_ADMIN_HREFS = [
  "/admin/storefront",
  "/admin/blogs",
  "/admin/emails",
  "/admin/testimonials",
  "/admin/whatsapp",
  "/admin/newsletter",
  "/admin",
  "/admin/analytics",
  "/admin/products",
] as const;

export function defaultAdminHomeHref(
  user: UserLike | null | undefined,
): string {
  if (!user || user.role === "admin") return "/admin";
  for (const href of ORDERED_ADMIN_HREFS) {
    if (canAccessAdminHref(user, href)) return href;
  }
  for (const area of ADMIN_ACCESS_AREAS) {
    if (!userHasAdminArea(user, area)) continue;
    if (area === "storefront") return "/admin/storefront";
    if (area === "marketing") return "/admin/blogs";
    if (area === "catalog") return "/admin/products";
    if (area === "sales") return "/admin/orders";
    if (area === "overview") return "/admin";
    if (area === "customers") return "/admin/reviews";
    if (area === "system") return "/admin/security/audit";
  }
  return "/admin";
}

export function teamRoleLabel(role: string | undefined): string {
  if (role === "admin") return "Owner admin";
  if (role === "staff") return "Team member";
  return "Customer";
}
