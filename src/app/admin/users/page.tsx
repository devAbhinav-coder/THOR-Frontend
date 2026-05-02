"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UserCheck,
  UserX,
  X,
  FileText,
  Clock3,
  Users,
  UserCog,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  StickyNote,
  Mail,
  Phone,
  Sparkles,
  Award,
  Store,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { User, type OfflineCustomerLead } from "@/types";
import {
  formatDate,
  formatPrice,
  cn,
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuthStore } from "@/store/useAuthStore";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";

type UserInsight = {
  user: User;
  metrics: {
    orderCount: number;
    paidOrderCount: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderAt?: string | null;
    userSegment: "frequent_buyer" | "repeat_buyer" | "new_buyer" | "prospect";
  };
  orders: Array<{
    _id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    items?: Array<{ quantity?: number }>;
  }>;
};

function tierBadge(segment: UserInsight["metrics"]["userSegment"]) {
  const map: Record<string, { label: string; className: string }> = {
    frequent_buyer: {
      label: "VIP",
      className: "bg-amber-100 text-amber-950 border-amber-200",
    },
    repeat_buyer: {
      label: "Returning",
      className: "bg-slate-100 text-slate-800 border-slate-200",
    },
    new_buyer: {
      label: "Member",
      className: "bg-emerald-50 text-emerald-900 border-emerald-100",
    },
    prospect: {
      label: "New",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };
  const t = map[segment] ?? {
    label: String(segment).replace(/_/g, " "),
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        t.className,
      )}
    >
      <Award className='h-3 w-3 shrink-0 opacity-90' aria-hidden />
      {t.label}
    </span>
  );
}

function UserAvatar({
  user,
  size = "md",
}: {
  user: User;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-16 w-16 text-xl"
    : size === "sm" ? "h-9 w-9 text-sm"
    : "h-11 w-11 text-base";
  return (
    <div className='relative shrink-0'>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md",
          dim,
        )}
      >
        {user.avatar ?
          <Image
            src={user.avatar}
            alt=''
            width={64}
            height={64}
            className='h-full w-full object-cover'
          />
        : <span className='text-brand-700 font-bold'>
            {user.name.charAt(0).toUpperCase()}
          </span>
        }
      </div>
      {user.adminNote && user.adminNote.trim().length > 0 && (
        <span
          className='absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm'
          title='Has admin note'
        >
          <StickyNote className='h-2.5 w-2.5 text-amber-950' aria-hidden />
        </span>
      )}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  loading,
  label,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  loading: boolean;
  label: string;
}) {
  if (totalPages <= 1 && total === 0) return null;
  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 border-t border-gray-100 bg-gradient-to-r from-gray-50/80 to-white'>
      <p className='text-xs text-gray-500'>
        {total.toLocaleString()} {label} total
        {totalPages > 1 && (
          <span className='text-gray-400'>
            {" "}
            · Page {page} of {totalPages}
          </span>
        )}
      </p>
      {totalPages > 1 && (
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 rounded-lg border-gray-200'
            disabled={loading || page <= 1}
            onClick={onPrev}
          >
            <ChevronLeft className='h-4 w-4' />
            Prev
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 rounded-lg border-gray-200'
            disabled={loading || page >= totalPages}
            onClick={onNext}
          >
            Next
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [listError, setListError] = useState(false);
  const [search, setSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const debouncedAdminSearch = useDebouncedValue(adminSearch.trim(), 300);
  const [userPage, setUserPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [adminPagination, setAdminPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [insight, setInsight] = useState<UserInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [directoryStats, setDirectoryStats] = useState<{
    users: { total: number; active: number; inactive: number };
    admins: { total: number; active: number; inactive: number };
  } | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?._id);

  const [offlineCustomers, setOfflineCustomers] = useState<
    OfflineCustomerLead[]
  >([]);
  const [offlinePage, setOfflinePage] = useState(1);
  const [offlinePagination, setOfflinePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [loadingOffline, setLoadingOffline] = useState(true);

  const loadUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    setListError(false);
    try {
      const res = await adminApi.getUsers({ page, limit: 20, role: "user" });
      setUsers(res.data.users);
      setPagination(res.pagination);
    } catch {
      setListError(true);
      toast.error("Could not load customers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAdmins = useCallback(async (page: number) => {
    setIsLoadingAdmins(true);
    try {
      const res = await adminApi.getUsers({ page, limit: 20, role: "admin" });
      setAdmins(res.data.users);
      setAdminPagination(res.pagination);
    } catch {
      toast.error("Could not load team accounts.");
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  const loadOfflineCustomers = useCallback(async (page: number) => {
    setLoadingOffline(true);
    try {
      const res = await adminApi.getOfflineCustomers({ page, limit: 20 });
      setOfflineCustomers(res.data.offlineCustomers as OfflineCustomerLead[]);
      setOfflinePagination(res.pagination);
    } catch {
      toast.error("Could not load offline customers.");
    } finally {
      setLoadingOffline(false);
    }
  }, []);

  const refreshDirectory = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadUsers(userPage),
        loadAdmins(adminPage),
        loadOfflineCustomers(offlinePage),
      ]);
      const r = await adminApi.getUserDirectoryStats();
      setDirectoryStats(r.data);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    userPage,
    adminPage,
    offlinePage,
    loadUsers,
    loadAdmins,
    loadOfflineCustomers,
  ]);

  useEffect(() => {
    void loadUsers(userPage);
  }, [userPage, loadUsers]);

  useEffect(() => {
    void loadAdmins(adminPage);
  }, [adminPage, loadAdmins]);

  useEffect(() => {
    adminApi
      .getUserDirectoryStats()
      .then((r) => setDirectoryStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadOfflineCustomers(offlinePage);
  }, [offlinePage, loadOfflineCustomers]);

  useEffect(() => {
    if (!selectedUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
        setInsight(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUser]);

  const toggleStatus = async (
    userId: string,
    role: "user" | "admin" = "user",
  ) => {
    setStatusTogglingId(userId);
    try {
      const res = await adminApi.toggleUserStatus(userId);
      const { isActive } = res.data;
      if (role === "admin") {
        setAdmins((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive } : u)),
        );
      } else {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive } : u)),
        );
      }
      toast.success(
        isActive ? "Account activated" : "Account blocked / deactivated",
      );
      adminApi
        .getUserDirectoryStats()
        .then((r) => setDirectoryStats(r.data))
        .catch(() => {});
    } catch {
      toast.error("Failed to update account status");
    } finally {
      setStatusTogglingId(null);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (
      !confirm(
        "Grant this customer admin access? They will be able to access this panel.",
      )
    )
      return;
    try {
      await adminApi.updateUserRole(userId, "admin");
      toast.success("User promoted to admin");
      await Promise.all([loadUsers(userPage), loadAdmins(adminPage)]);
      adminApi
        .getUserDirectoryStats()
        .then((r) => setDirectoryStats(r.data))
        .catch(() => {});
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const demoteToUser = async (userId: string) => {
    if (!confirm("Remove admin role? They will become a regular customer."))
      return;
    try {
      await adminApi.updateUserRole(userId, "user");
      toast.success("Admin demoted to user");
      await Promise.all([loadUsers(userPage), loadAdmins(adminPage)]);
      adminApi
        .getUserDirectoryStats()
        .then((r) => setDirectoryStats(r.data))
        .catch(() => {});
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const openUserInsights = async (user: User) => {
    setSelectedUser(user);
    setLoadingInsight(true);
    setInsight(null);
    try {
      const res = await adminApi.getUserInsights(user._id);
      const inner = res.data as UserInsight;
      setInsight(inner);
      setNoteDraft(String(inner.user?.adminNote || ""));
    } catch {
      toast.error("Failed to load user activity");
    } finally {
      setLoadingInsight(false);
    }
  };

  const saveUserNote = async () => {
    if (!selectedUser) return;
    setSavingNote(true);
    try {
      await adminApi.updateUserNote(selectedUser._id, noteDraft);
      setInsight((prev) =>
        prev ? { ...prev, user: { ...prev.user, adminNote: noteDraft } } : prev,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id ? { ...u, adminNote: noteDraft } : u,
        ),
      );
      setAdmins((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id ? { ...u, adminNote: noteDraft } : u,
        ),
      );
      toast.success("Admin note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)),
    );
  }, [users, debouncedSearch]);

  const filteredAdmins = useMemo(() => {
    const q = debouncedAdminSearch.toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)),
    );
  }, [admins, debouncedAdminSearch]);

  const userStats = useMemo(() => {
    if (directoryStats) {
      return {
        totalUsers: directoryStats.users.total,
        activeUsers: directoryStats.users.active,
        inactiveUsers: directoryStats.users.inactive,
        totalAdmins: directoryStats.admins.total,
        inactiveAdmins: directoryStats.admins.inactive,
      };
    }
    const activeUsers = users.filter((u) => u.isActive).length;
    const inactiveUsers = Math.max(0, pagination.total - activeUsers);
    return {
      totalUsers: pagination.total,
      activeUsers,
      inactiveUsers,
      totalAdmins: adminPagination.total,
      inactiveAdmins: 0,
    };
  }, [directoryStats, users, pagination.total, adminPagination.total]);

  const statCards = [
    {
      label: "Registered customers",
      value: userStats.totalUsers,
      sub: "All time",
      icon: Users,
      accent: "from-brand-50 to-white border-brand-100/80",
      iconBg: "bg-brand-100 text-brand-700",
    },
    {
      label: "Active",
      value: userStats.activeUsers,
      sub: "Can sign in",
      icon: UserCheck,
      accent: "from-emerald-50/90 to-white border-emerald-100/80",
      iconBg: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Blocked",
      value: userStats.inactiveUsers,
      sub: "Cannot sign in",
      icon: UserX,
      accent: "from-amber-50/90 to-white border-amber-100/80",
      iconBg: "bg-amber-100 text-amber-900",
    },
    {
      label: "Team (admins)",
      value: userStats.totalAdmins,
      sub: "Panel access",
      icon: Shield,
      accent: "from-navy-50/80 to-white border-navy-100/80",
      iconBg: "bg-navy-100 text-navy-800",
    },
    {
      label: "Admins inactive",
      value: userStats.inactiveAdmins,
      sub: "Blocked admin seats",
      icon: UserCog,
      accent: "from-slate-50 to-white border-slate-200/80",
      iconBg: "bg-slate-200 text-slate-800",
    },
  ];

  return (
    <div className='min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-white'>
      <div className='p-4 sm:p-6 xl:p-8 max-w-[1600px] mx-auto space-y-8'>
        <AdminPageHeader
          title='Users & team'
          badge='Directory'
          description='Customers who shop with you, and admins who run the store. Block access, review spend, and keep internal notes — all in one place.'
          actions={
            <>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl border-gray-200 bg-white shadow-sm'
                onClick={() => refreshDirectory()}
                disabled={isRefreshing || isLoading || isLoadingAdmins}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link
                href='/admin/revenue'
                className='inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm'
              >
                Revenue
              </Link>
            </>
          }
        />

        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'>
          {statCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
                "bg-gradient-to-br",
                card.accent,
              )}
            >
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
                    {card.label}
                  </p>
                  <p className='mt-1.5 text-2xl font-bold text-gray-900 tabular-nums tracking-tight'>
                    {card.value}
                  </p>
                  <p className='mt-0.5 text-[11px] text-gray-500'>{card.sub}</p>
                </div>
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    card.iconBg,
                  )}
                >
                  <card.icon className='h-5 w-5' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {listError && !isLoading && users.length === 0 ?
          <AdminErrorState onRetry={() => loadUsers(userPage)} />
        : null}

        {/* Offline / POS leads — one row per email until they sign up or link Google */}
        <section className='rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-[0_20px_50px_-28px_rgba(120,53,15,0.12)] overflow-hidden'>
          <div className='px-4 sm:px-6 py-5 border-b border-amber-100/80 bg-gradient-to-r from-amber-950/[0.03] via-white to-white'>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
              <div className='flex items-start gap-3'>
                <div className='h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0'>
                  <Store className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='font-serif text-lg font-bold text-gray-900 tracking-tight'>
                    Offline customers (POS)
                  </h2>
                  {/* <p className="text-xs text-gray-600 mt-0.5 max-w-2xl">
                    Emails from admin-recorded offline orders when no full account existed yet. One entry per email for
                    campaigns. The row disappears after they complete sign-up (email OTP), set a password via reset, or
                    use Google with the same email.
                  </p> */}
                  <p className='text-[11px] text-amber-900/80 font-semibold mt-2'>
                    {offlinePagination.total.toLocaleString()} lead
                    {offlinePagination.total === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='hidden sm:block overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-amber-50/60 text-[11px] text-gray-600 uppercase tracking-wider border-b border-amber-100/80'>
                  <th className='text-left px-5 py-3 font-semibold'>Name</th>
                  <th className='text-left px-5 py-3 font-semibold'>Email</th>
                  <th className='text-left px-5 py-3 font-semibold'>Phone</th>
                  <th className='text-left px-5 py-3 font-semibold'>
                    Last offline order
                  </th>
                  <th className='text-right px-5 py-3 font-semibold'>
                    POS orders
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-amber-100/60'>
                {loadingOffline ?
                  <tr>
                    <td
                      colSpan={5}
                      className='px-5 py-10 text-center text-gray-500'
                    >
                      Loading…
                    </td>
                  </tr>
                : offlineCustomers.length === 0 ?
                  <tr>
                    <td
                      colSpan={5}
                      className='px-5 py-10 text-center text-gray-500'
                    >
                      No offline leads yet. They appear when you create an
                      offline order for a new email.
                    </td>
                  </tr>
                : offlineCustomers.map((row) => (
                    <tr
                      key={row.email}
                      className='hover:bg-amber-50/30 transition-colors'
                    >
                      <td className='px-5 py-3.5 font-medium text-gray-900'>
                        {row.name}
                      </td>
                      <td className='px-5 py-3.5'>
                        <span className='text-gray-800 tabular-nums'>
                          {row.email}
                        </span>
                      </td>
                      <td className='px-5 py-3.5 text-gray-700 tabular-nums'>
                        {row.phone}
                      </td>
                      <td className='px-5 py-3.5 text-gray-600 text-xs'>
                        {row.lastOfflineOrderAt ?
                          formatDate(row.lastOfflineOrderAt)
                        : "—"}
                      </td>
                      <td className='px-5 py-3.5 text-right tabular-nums text-gray-800'>
                        {row.offlineOrderCount ?? "—"}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div className='sm:hidden divide-y divide-amber-100/60'>
            {loadingOffline ?
              <p className='px-4 py-8 text-center text-sm text-gray-500'>
                Loading…
              </p>
            : offlineCustomers.length === 0 ?
              <p className='px-4 py-8 text-center text-sm text-gray-500'>
                No offline leads yet. Create an offline order for a new email to
                add one.
              </p>
            : offlineCustomers.map((row) => (
                <div key={row.email} className='px-4 py-4 space-y-1'>
                  <p className='font-semibold text-gray-900'>{row.name}</p>
                  <p className='text-xs text-gray-600 flex items-center gap-1.5'>
                    <Mail className='h-3.5 w-3.5 shrink-0 opacity-70' />
                    {row.email}
                  </p>
                  <p className='text-xs text-gray-600 flex items-center gap-1.5'>
                    <Phone className='h-3.5 w-3.5 shrink-0 opacity-70' />
                    {row.phone}
                  </p>
                  <p className='text-[11px] text-gray-500'>
                    Last:{" "}
                    {row.lastOfflineOrderAt ?
                      formatDate(row.lastOfflineOrderAt)
                    : "—"}{" "}
                    · POS orders: {row.offlineOrderCount ?? "—"}
                  </p>
                </div>
              ))
            }
          </div>

          <PaginationBar
            page={offlinePagination.currentPage}
            totalPages={offlinePagination.totalPages}
            total={offlinePagination.total}
            onPrev={() => setOfflinePage((p) => Math.max(1, p - 1))}
            onNext={() => setOfflinePage((p) => p + 1)}
            loading={loadingOffline}
            label='offline leads'
          />
        </section>

        {/* Admins */}
        <section className='rounded-2xl border border-gray-200/80 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] overflow-hidden'>
          <div className='px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-navy-950/5 via-white to-white'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div className='h-11 w-11 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-md'>
                  <UserCog className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='font-serif text-lg font-bold text-gray-900 tracking-tight'>
                    Team & admins
                  </h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {adminPagination.total} accounts · search filters this page
                  </p>
                </div>
              </div>
            </div>
            <div className='mt-4 max-w-md'>
              <SearchField
                value={adminSearch}
                onChange={setAdminSearch}
                placeholder='Search name, email, phone…'
                isLoading={adminSearch.trim() !== debouncedAdminSearch}
                aria-label='Search admins'
              />
            </div>
          </div>

          <div className='sm:hidden divide-y divide-gray-100'>
            {isLoadingAdmins ?
              [...Array(3)].map((_, i) => (
                <div key={i} className='px-4 py-4'>
                  <div className='h-24 rounded-xl bg-gray-100 animate-pulse' />
                </div>
              ))
            : filteredAdmins.length === 0 ?
              <p className='px-4 py-10 text-center text-sm text-gray-500'>
                {admins.length === 0 ?
                  "No admin accounts yet."
                : "No matches on this page."}
              </p>
            : filteredAdmins.map((user) => (
                <div
                  key={user._id}
                  className='px-4 py-4 hover:bg-gray-50/80 transition-colors'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <UserAvatar user={user} size='md' />
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <p className='text-sm font-semibold text-gray-900 truncate'>
                            {user.name}
                          </p>
                          {user._id === currentUserId && (
                            <Badge variant='brand' className='text-[10px] py-0'>
                              You
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-gray-500 truncate'>
                          {user.email}
                        </p>
                        <p className='text-[11px] text-gray-400 mt-0.5 tabular-nums'>
                          {user.phone || "—"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={user.isActive ? "success" : "error"}
                      className='text-[10px] shrink-0'
                    >
                      {user.isActive ? "Active" : "Blocked"}
                    </Badge>
                  </div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <button
                      type='button'
                      onClick={() => openUserInsights(user)}
                      className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm'
                    >
                      <FileText className='h-3.5 w-3.5' />
                      Profile & activity
                    </button>
                    <button
                      type='button'
                      onClick={() => toggleStatus(user._id, "admin")}
                      disabled={
                        statusTogglingId === user._id ||
                        user._id === currentUserId
                      }
                      title={
                        user._id === currentUserId ?
                          "Another admin must change your status"
                        : undefined
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-sm disabled:opacity-50",
                        user.isActive ?
                          "text-red-700 bg-red-50/80 border-red-200 hover:bg-red-50"
                        : "text-green-800 bg-green-50/80 border-green-200 hover:bg-green-50",
                      )}
                    >
                      {statusTogglingId === user._id ?
                        "…"
                      : user.isActive ?
                        <>
                          <UserX className='h-3.5 w-3.5' /> Block
                        </>
                      : <>
                          <UserCheck className='h-3.5 w-3.5' /> Unblock
                        </>
                      }
                    </button>
                    <button
                      type='button'
                      onClick={() => demoteToUser(user._id)}
                      disabled={user._id === currentUserId}
                      className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50/90 border border-amber-200 hover:bg-amber-50 transition-colors disabled:opacity-40'
                    >
                      Demote
                    </button>
                  </div>
                </div>
              ))
            }
          </div>

          <div className='hidden sm:block overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50/95 text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100'>
                  <th className='text-left px-5 py-3.5 font-semibold'>Admin</th>
                  <th className='text-left px-5 py-3.5 font-semibold'>Phone</th>
                  <th className='text-left px-5 py-3.5 font-semibold'>
                    Joined
                  </th>
                  <th className='text-left px-5 py-3.5 font-semibold'>
                    Status
                  </th>
                  <th className='text-right px-5 py-3.5 font-semibold'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {isLoadingAdmins ?
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className='px-5 py-4'>
                        <div className='h-10 bg-gray-100 rounded-lg animate-pulse' />
                      </td>
                    </tr>
                  ))
                : filteredAdmins.map((user) => (
                    <tr
                      key={user._id}
                      className='hover:bg-brand-50/20 transition-colors group'
                    >
                      <td className='px-5 py-3.5'>
                        <div className='flex items-center gap-3'>
                          <UserAvatar user={user} size='sm' />
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              <p className='font-semibold text-gray-900 truncate'>
                                {user.name}
                              </p>
                              {user._id === currentUserId && (
                                <Badge
                                  variant='brand'
                                  className='text-[10px] py-0'
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className='text-xs text-gray-400 truncate'>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3.5 text-gray-600 tabular-nums'>
                        {user.phone || "—"}
                      </td>
                      <td className='px-5 py-3.5 text-gray-500'>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className='px-5 py-3.5'>
                        <Badge
                          variant={user.isActive ? "success" : "error"}
                          className='text-xs'
                        >
                          {user.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className='px-5 py-3.5'>
                        <div className='flex justify-end gap-1.5 flex-wrap'>
                          <button
                            type='button'
                            onClick={() => openUserInsights(user)}
                            className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm'
                          >
                            <FileText className='h-3 w-3' />
                            Activity
                          </button>
                          <button
                            type='button'
                            onClick={() => toggleStatus(user._id, "admin")}
                            disabled={
                              statusTogglingId === user._id ||
                              user._id === currentUserId
                            }
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50",
                              user.isActive ?
                                "text-red-700 border-red-200 hover:bg-red-50"
                              : "text-green-800 border-green-200 hover:bg-green-50",
                            )}
                          >
                            {statusTogglingId === user._id ?
                              "…"
                            : user.isActive ?
                              "Block"
                            : "Unblock"}
                          </button>
                          <button
                            type='button'
                            onClick={() => demoteToUser(user._id)}
                            disabled={user._id === currentUserId}
                            className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-50 disabled:opacity-40'
                          >
                            Demote
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={adminPagination.currentPage}
            totalPages={adminPagination.totalPages}
            total={adminPagination.total}
            loading={isLoadingAdmins}
            label='admins'
            onPrev={() => setAdminPage((p) => Math.max(1, p - 1))}
            onNext={() => setAdminPage((p) => p + 1)}
          />
        </section>

        {/* Customers */}
        <section className='rounded-2xl border border-gray-200/80 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] overflow-hidden'>
          <div className='px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-brand-50/40 via-white to-white'>
            <div className='flex items-center gap-3'>
              <div className='h-11 w-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center shadow-md'>
                <Users className='h-5 w-5' />
              </div>
              <div>
                <h2 className='font-serif text-lg font-bold text-gray-900 tracking-tight'>
                  Customers
                </h2>
                <p className='text-xs text-gray-500 mt-0.5'>
                  {pagination.total} in directory · search filters this page
                  only
                </p>
              </div>
            </div>
            <div className='mt-4 max-w-md'>
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder='Name, email, or phone…'
                isLoading={search.trim() !== debouncedSearch}
                aria-label='Search users'
              />
            </div>
          </div>

          <div className='sm:hidden divide-y divide-gray-100'>
            {isLoading ?
              [...Array(4)].map((_, i) => (
                <div key={i} className='px-4 py-4'>
                  <div className='h-28 rounded-xl bg-gray-100 animate-pulse' />
                </div>
              ))
            : filtered.length === 0 ?
              <p className='px-4 py-10 text-center text-sm text-gray-500'>
                {users.length === 0 ?
                  "No customers yet."
                : "No matches on this page."}
              </p>
            : filtered.map((user) => (
                <div
                  key={user._id}
                  className='px-4 py-4 hover:bg-gray-50/80 transition-colors'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <UserAvatar user={user} size='md' />
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-gray-900 truncate'>
                          {user.name}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>
                          {user.email}
                        </p>
                        <p className='text-[11px] text-gray-400 mt-0.5'>
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={user.isActive ? "success" : "error"}
                      className='text-[10px] shrink-0'
                    >
                      {user.isActive ? "Active" : "Blocked"}
                    </Badge>
                  </div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <button
                      type='button'
                      onClick={() => openUserInsights(user)}
                      className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm'
                    >
                      <FileText className='h-3.5 w-3.5' />
                      Profile & activity
                    </button>
                    <button
                      type='button'
                      onClick={() => toggleStatus(user._id, "user")}
                      disabled={
                        statusTogglingId === user._id ||
                        user._id === currentUserId
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-sm disabled:opacity-50",
                        user.isActive ?
                          "text-red-700 bg-red-50/80 border-red-200"
                        : "text-green-800 bg-green-50/80 border-green-200",
                      )}
                    >
                      {statusTogglingId === user._id ?
                        "…"
                      : user.isActive ?
                        <>
                          <UserX className='h-3.5 w-3.5' /> Block
                        </>
                      : <>
                          <UserCheck className='h-3.5 w-3.5' /> Unblock
                        </>
                      }
                    </button>
                    <button
                      type='button'
                      onClick={() => promoteToAdmin(user._id)}
                      className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-200 hover:bg-brand-100/80 transition-colors'
                    >
                      <UserPlus className='h-3.5 w-3.5' />
                      Make admin
                    </button>
                  </div>
                </div>
              ))
            }
          </div>

          <div className='hidden sm:block overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50/95 text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100'>
                  <th className='text-left px-5 py-3.5 font-semibold'>
                    Customer
                  </th>
                  <th className='text-left px-5 py-3.5 font-semibold'>Phone</th>
                  <th className='text-left px-5 py-3.5 font-semibold'>
                    Joined
                  </th>
                  <th className='text-left px-5 py-3.5 font-semibold'>
                    Status
                  </th>
                  <th className='text-right px-5 py-3.5 font-semibold'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {isLoading ?
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className='px-5 py-4'>
                        <div className='h-10 bg-gray-100 rounded-lg animate-pulse' />
                      </td>
                    </tr>
                  ))
                : filtered.map((user) => (
                    <tr
                      key={user._id}
                      className='hover:bg-brand-50/15 transition-colors'
                    >
                      <td className='px-5 py-3.5'>
                        <div className='flex items-center gap-3'>
                          <UserAvatar user={user} size='sm' />
                          <div className='min-w-0'>
                            <p className='font-semibold text-gray-900 truncate'>
                              {user.name}
                            </p>
                            <p className='text-xs text-gray-400 truncate'>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3.5 text-gray-600 tabular-nums'>
                        {user.phone || "—"}
                      </td>
                      <td className='px-5 py-3.5 text-gray-500'>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className='px-5 py-3.5'>
                        <Badge
                          variant={user.isActive ? "success" : "error"}
                          className='text-xs'
                        >
                          {user.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className='px-5 py-3.5'>
                        <div className='flex justify-end gap-1.5 flex-wrap'>
                          <button
                            type='button'
                            onClick={() => openUserInsights(user)}
                            className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white border border-transparent hover:border-gray-200'
                          >
                            <FileText className='h-3 w-3' />
                            Activity
                          </button>
                          <button
                            type='button'
                            onClick={() => toggleStatus(user._id, "user")}
                            disabled={
                              statusTogglingId === user._id ||
                              user._id === currentUserId
                            }
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50",
                              user.isActive ?
                                "text-red-700 border-red-200 hover:bg-red-50"
                              : "text-green-800 border-green-200 hover:bg-green-50",
                            )}
                          >
                            {statusTogglingId === user._id ?
                              "…"
                            : user.isActive ?
                              "Block"
                            : "Unblock"}
                          </button>
                          <button
                            type='button'
                            onClick={() => promoteToAdmin(user._id)}
                            className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-800 border border-brand-200 hover:bg-brand-50'
                          >
                            <UserPlus className='h-3 w-3' />
                            Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            loading={isLoading}
            label='customers'
            onPrev={() => setUserPage((p) => Math.max(1, p - 1))}
            onNext={() => setUserPage((p) => p + 1)}
          />
        </section>
      </div>

      {selectedUser && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <button
            type='button'
            className='absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]'
            aria-label='Close'
            onClick={() => {
              setSelectedUser(null);
              setInsight(null);
            }}
          />
          <div className='relative w-full sm:max-w-lg md:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100'>
            <div className='px-5 sm:px-7 pt-6 pb-5 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 text-white shrink-0'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-4 min-w-0'>
                  <UserAvatar user={selectedUser} size='lg' />
                  <div className='min-w-0'>
                    <p className='text-[11px] font-semibold uppercase tracking-wider text-white/60'>
                      Customer profile
                    </p>
                    <h3 className='text-xl font-bold font-serif truncate'>
                      {selectedUser.name}
                    </h3>
                    <div className='mt-2 flex flex-col gap-1.5 text-sm text-white/85'>
                      <a
                        href={`mailto:${encodeURIComponent(selectedUser.email)}`}
                        className='inline-flex items-center gap-2 truncate hover:text-gold-300 transition-colors'
                      >
                        <Mail className='h-4 w-4 shrink-0 opacity-80' />
                        {selectedUser.email}
                      </a>
                      {selectedUser.phone ?
                        <a
                          href={`tel:${selectedUser.phone.replace(/\s/g, "")}`}
                          className='inline-flex items-center gap-2 tabular-nums hover:text-gold-300 transition-colors'
                        >
                          <Phone className='h-4 w-4 shrink-0 opacity-80' />
                          {selectedUser.phone}
                        </a>
                      : null}
                    </div>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedUser(null);
                    setInsight(null);
                  }}
                  className='h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'
                  aria-label='Close'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>

            <div className='p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 bg-gradient-to-b from-gray-50/50 to-white'>
              {loadingInsight ?
                <div className='space-y-3 animate-pulse'>
                  <div className='h-24 bg-gray-100 rounded-2xl' />
                  <div className='h-40 bg-gray-100 rounded-2xl' />
                </div>
              : insight ?
                <>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    {[
                      { label: "Orders", v: insight.metrics.orderCount },
                      { label: "Paid", v: insight.metrics.paidOrderCount },
                      {
                        label: "Spent",
                        v: formatPrice(insight.metrics.totalSpent),
                      },
                      {
                        label: "AOV",
                        v: formatPrice(insight.metrics.avgOrderValue),
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className='rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm'
                      >
                        <p className='text-[11px] font-medium text-gray-500'>
                          {row.label}
                        </p>
                        <p className='mt-1 text-lg font-bold text-gray-900 tabular-nums'>
                          {row.v}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    {tierBadge(insight.metrics.userSegment)}
                    {insight.metrics.lastOrderAt && (
                      <span className='text-xs text-gray-500 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1'>
                        <Clock3 className='h-3.5 w-3.5' /> Last order{" "}
                        {formatDate(insight.metrics.lastOrderAt)}
                      </span>
                    )}
                  </div>

                  <div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                    <div className='flex items-center gap-2 mb-2'>
                      <StickyNote className='h-4 w-4 text-amber-600' />
                      <p className='text-sm font-semibold text-gray-900'>
                        Internal notes
                      </p>
                      <span className='text-[10px] text-gray-400'>
                        (team only)
                      </span>
                    </div>
                    <textarea
                      value={noteDraft}
                      onChange={(e) =>
                        setNoteDraft(e.target.value.slice(0, 1000))
                      }
                      rows={4}
                      placeholder='Support context, VIP handling, risk flags…'
                      className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-300'
                    />
                    <div className='mt-2 flex items-center justify-between'>
                      <span className='text-xs text-gray-400'>
                        {noteDraft.length}/1000
                      </span>
                      <Button
                        type='button'
                        size='sm'
                        className='rounded-xl'
                        onClick={saveUserNote}
                        disabled={savingNote}
                      >
                        {savingNote ? "Saving…" : "Save note"}
                      </Button>
                    </div>
                  </div>

                  <div className='rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm'>
                    <div className='px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80'>
                      <Sparkles className='h-4 w-4 text-brand-600' />
                      <p className='text-sm font-semibold text-gray-900'>
                        Recent orders
                      </p>
                    </div>
                    <div className='divide-y divide-gray-100 max-h-64 overflow-y-auto'>
                      {insight.orders.length === 0 ?
                        <p className='px-4 py-8 text-sm text-gray-500 text-center'>
                          No orders yet.
                        </p>
                      : insight.orders.map((o) => (
                          <div
                            key={o._id}
                            className='px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/80'
                          >
                            <div className='min-w-0'>
                              <p className='text-sm font-bold text-gray-900'>
                                {o.orderNumber}
                              </p>
                              <p className='text-xs text-gray-500 mt-0.5'>
                                {formatDate(o.createdAt)}
                              </p>
                              <div className='flex flex-wrap gap-1.5 mt-2'>
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                                    getOrderStatusColor(o.status),
                                  )}
                                >
                                  {o.status}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                                    getPaymentStatusColor(o.paymentStatus),
                                  )}
                                >
                                  {o.paymentStatus}
                                </span>
                              </div>
                            </div>
                            <div className='text-right shrink-0'>
                              <p className='text-sm font-bold text-gray-900 tabular-nums'>
                                {formatPrice(o.total)}
                              </p>
                              <Link
                                href={`/admin/orders/${encodeURIComponent(o._id)}`}
                                className='text-xs font-semibold text-brand-600 hover:text-brand-700 mt-1 inline-block'
                              >
                                Open order →
                              </Link>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </>
              : <p className='text-sm text-gray-500 text-center py-8'>
                  Could not load activity.
                </p>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
