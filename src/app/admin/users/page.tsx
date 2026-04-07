'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserCheck, UserX, X, FileText, Clock3, ShieldCheck, Users, UserCog, UserPlus } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchField } from '@/components/ui/SearchField';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function AdminUsersPage() {
  type UserInsight = {
    user: User;
    metrics: {
      orderCount: number;
      paidOrderCount: number;
      totalSpent: number;
      avgOrderValue: number;
      lastOrderAt?: string | null;
      userSegment: 'frequent_buyer' | 'repeat_buyer' | 'new_buyer' | 'prospect';
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

  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [search, setSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const debouncedAdminSearch = useDebouncedValue(adminSearch.trim(), 300);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [adminPagination, setAdminPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [insight, setInsight] = useState<UserInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchUsers = async (page = 1, role: 'user' | 'admin' = 'user') => {
    if (role === 'admin') setIsLoadingAdmins(true);
    else setIsLoading(true);
    try {
      const res = await adminApi.getUsers({ page, limit: 20, role });
      if (role === 'admin') {
        setAdmins(res.data.users);
        setAdminPagination(res.pagination);
      } else {
        setUsers(res.data.users);
        setPagination(res.pagination);
      }
    } catch {
      // silent fail
    } finally {
      if (role === 'admin') setIsLoadingAdmins(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers(1, 'user');
    void fetchUsers(1, 'admin');
  }, []);

  const toggleStatus = async (userId: string, role: 'user' | 'admin' = 'user') => {
    setIsLoading(true);
    try {
      const res = await adminApi.toggleUserStatus(userId);
      const { isActive } = res.data;
      if (role === 'admin') {
        setAdmins((prev) => prev.map((u) => u._id === userId ? { ...u, isActive } : u));
      } else {
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive } : u));
      }
      toast.success(isActive ? 'User activated' : 'User deactivated');
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      await adminApi.updateUserRole(userId, 'admin');
      const promoted = users.find((u) => u._id === userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      if (promoted) setAdmins((prev) => [{ ...promoted, role: 'admin' }, ...prev]);
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      setAdminPagination((p) => ({ ...p, total: p.total + 1 }));
      toast.success('User promoted to admin');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const demoteToUser = async (userId: string) => {
    try {
      await adminApi.updateUserRole(userId, 'user');
      const demoted = admins.find((u) => u._id === userId);
      setAdmins((prev) => prev.filter((u) => u._id !== userId));
      if (demoted) setUsers((prev) => [{ ...demoted, role: 'user' }, ...prev]);
      setAdminPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      setPagination((p) => ({ ...p, total: p.total + 1 }));
      toast.success('Admin demoted to user');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const openUserInsights = async (user: User) => {
    setSelectedUser(user);
    setLoadingInsight(true);
    try {
      const res = await adminApi.getUserInsights(user._id);
      setInsight(res.data as UserInsight);
      setNoteDraft(String((res.data as UserInsight)?.user?.adminNote || ''));
    } catch {
      toast.error('Failed to load user activity');
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
        prev
          ? { ...prev, user: { ...prev.user, adminNote: noteDraft } }
          : prev
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, adminNote: noteDraft } : u)),
      );
      setAdmins((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, adminNote: noteDraft } : u)),
      );
      toast.success('Admin note saved');
    } catch {
      toast.error('Failed to save note');
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
    const activeUsers = users.filter((u) => u.isActive).length;
    const inactiveUsers = users.length - activeUsers;
    return { totalUsers: pagination.total, activeUsers, inactiveUsers, totalAdmins: adminPagination.total };
  }, [users, pagination.total, adminPagination.total]);

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Registered Users</h1>
          <p className="text-gray-500 text-sm">{pagination.total} users total · block/allow + activity insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
          <p className="text-[11px] text-gray-500">Total users</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{userStats.totalUsers}</p>
          <Users className="mt-2 h-4 w-4 text-brand-600" />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
          <p className="text-[11px] text-gray-500">Active users</p>
          <p className="mt-1 text-xl font-bold text-green-700">{userStats.activeUsers}</p>
          <UserCheck className="mt-2 h-4 w-4 text-green-600" />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
          <p className="text-[11px] text-gray-500">Inactive users</p>
          <p className="mt-1 text-xl font-bold text-red-700">{userStats.inactiveUsers}</p>
          <UserX className="mt-2 h-4 w-4 text-red-600" />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
          <p className="text-[11px] text-gray-500">Admins</p>
          <p className="mt-1 text-xl font-bold text-navy-900">{userStats.totalAdmins}</p>
          <UserCog className="mt-2 h-4 w-4 text-navy-700" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Admins</h2>
          <p className="text-xs text-gray-500 mt-0.5">{adminPagination.total} admins total</p>
          <div className="mt-3">
            <SearchField
              value={adminSearch}
              onChange={setAdminSearch}
              placeholder="Search admins…"
              isLoading={adminSearch.trim() !== debouncedAdminSearch}
              aria-label="Search admins"
            />
          </div>
        </div>
        <div className="sm:hidden divide-y divide-gray-100">
          {isLoadingAdmins ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            ))
          ) : filteredAdmins.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No admins found.</p>
          ) : (
            filteredAdmins.map((user) => (
              <div key={user._id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.name} width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-brand-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Joined {formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? 'success' : 'error'} className="text-[10px]">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openUserInsights(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-700 hover:bg-gray-100 border border-gray-200"
                  >
                    <FileText className="h-3 w-3" />
                    Activity
                  </button>
                  <button
                    onClick={() => demoteToUser(user._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-amber-700 hover:bg-amber-50 border border-amber-200"
                  >
                    Demote
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Admin</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingAdmins ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filteredAdmins.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <Image src={user.avatar} alt={user.name} width={36} height={36} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-brand-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={user.isActive ? 'success' : 'error'} className="text-xs">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openUserInsights(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-700 hover:bg-gray-100 border border-gray-200"
                      >
                        <FileText className="h-3 w-3" />
                        Activity
                      </button>
                      <button
                        onClick={() => demoteToUser(user._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-amber-700 hover:bg-amber-50 border border-amber-200"
                      >
                        Demote to User
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Users</h2>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Name, email, or phone…"
            isLoading={search.trim() !== debouncedSearch}
            aria-label="Search users"
          />
        </div>
        <div className="sm:hidden divide-y divide-gray-100">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No users found.</p>
          ) : (
            filtered.map((user) => (
              <div key={user._id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.name} width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-brand-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Joined {formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? 'success' : 'error'} className="text-[10px]">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openUserInsights(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-700 hover:bg-gray-100 border border-gray-200"
                  >
                    <FileText className="h-3 w-3" />
                    Activity
                  </button>
                  <button
                    onClick={() => toggleStatus(user._id, 'user')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      user.isActive
                        ? 'text-red-600 hover:bg-red-50 border border-red-200'
                        : 'text-green-600 hover:bg-green-50 border border-green-200'
                    }`}
                  >
                    {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => promoteToAdmin(user._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-brand-700 hover:bg-brand-50 border border-brand-200"
                  >
                    <UserPlus className="h-3 w-3" />
                    Make Admin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <Image src={user.avatar} alt={user.name} width={36} height={36} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-brand-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={user.isActive ? 'success' : 'error'} className="text-xs">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openUserInsights(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-700 hover:bg-gray-100 border border-gray-200"
                      >
                        <FileText className="h-3 w-3" />
                        Activity
                      </button>
                      <button
                        onClick={() => toggleStatus(user._id, 'user')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'text-red-600 hover:bg-red-50 border border-red-200'
                            : 'text-green-600 hover:bg-green-50 border border-green-200'
                        }`}
                      >
                        {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => promoteToAdmin(user._id)}
                        className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-brand-700 hover:bg-brand-50 border border-brand-200"
                      >
                        Make Admin
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0" onClick={() => { setSelectedUser(null); setInsight(null); }} />
          <div className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88vh] overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">User Activity & Controls</p>
                <h3 className="text-lg font-bold text-gray-900 truncate">{selectedUser.name}</h3>
              </div>
              <button
                onClick={() => { setSelectedUser(null); setInsight(null); }}
                className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 max-h-[calc(88vh-64px)]">
              {loadingInsight ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-xl" />
                  <div className="h-20 bg-gray-100 rounded-xl" />
                </div>
              ) : insight ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-[11px] text-gray-500">Orders</p>
                      <p className="text-lg font-bold text-gray-900">{insight.metrics.orderCount}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-[11px] text-gray-500">Paid</p>
                      <p className="text-lg font-bold text-gray-900">{insight.metrics.paidOrderCount}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-[11px] text-gray-500">Spent</p>
                      <p className="text-lg font-bold text-gray-900">{formatPrice(insight.metrics.totalSpent)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-[11px] text-gray-500">AOV</p>
                      <p className="text-lg font-bold text-gray-900">{formatPrice(insight.metrics.avgOrderValue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {insight.metrics.userSegment.replace('_', ' ')}
                    </Badge>
                    {insight.metrics.lastOrderAt && (
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" /> Last order: {formatDate(insight.metrics.lastOrderAt)}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Admin Notes</p>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value.slice(0, 1000))}
                      rows={4}
                      placeholder="Add context for support/sales follow-up, risk flags, preferences..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{noteDraft.length}/1000</span>
                      <button
                        onClick={saveUserNote}
                        disabled={savingNote}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        {savingNote ? 'Saving…' : 'Save Note'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Order History</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {insight.orders.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-gray-500">No orders yet for this user.</p>
                      ) : (
                        insight.orders.map((o) => (
                          <div key={o._id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{o.orderNumber}</p>
                              <p className="text-xs text-gray-500">{formatDate(o.createdAt)} · {o.status}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatPrice(o.total)}</p>
                              <Link href={`/admin/orders/${encodeURIComponent(o._id)}`} className="text-xs text-brand-600 hover:text-brand-700">
                                Open
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No activity data found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
