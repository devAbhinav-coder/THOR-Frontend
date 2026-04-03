'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { UserCheck, UserX } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchField } from '@/components/ui/SearchField';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function AdminUsersPage() {
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

  return (
    <div className="p-6 xl:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{pagination.total} users total</p>
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
        <div className="overflow-x-auto">
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
                    <div className="flex justify-end">
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

        <div className="overflow-x-auto">
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
                    <div className="flex justify-end">
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
    </div>
  );
}
