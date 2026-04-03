'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { adminApi } from '@/lib/api';

type AuditUser = { _id?: string; name?: string; email?: string; role?: 'user' | 'admin' };
type AuditLog = {
  _id: string;
  action: string;
  ip?: string;
  userAgent?: string;
  actor?: AuditUser;
  targetUser?: AuditUser;
  meta?: Record<string, unknown>;
  createdAt: string;
};

const ACTIONS = [
  '',
  'auth.login.failed',
  'user.status.toggled',
  'user.role.updated',
];

export default function AdminSecurityAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [action, setAction] = useState('');
  const [ip, setIp] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getAuditLogs({
          page,
          limit: 25,
          ...(action ? { action } : {}),
          ...(ip.trim() ? { ip: ip.trim() } : {}),
          ...(userId.trim() ? { userId: userId.trim() } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        });
        setLogs((res.data.logs || []) as AuditLog[]);
        setPagination(res.pagination || { currentPage: 1, totalPages: 1, total: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [page, action, ip, userId, from, to]);

  const pageText = useMemo(
    () => `${pagination.currentPage}/${Math.max(1, pagination.totalPages)}`,
    [pagination.currentPage, pagination.totalPages]
  );

  const renderActor = (log: AuditLog) => {
    if (log.actor?.name) {
      return (
        <>
          {log.actor.name}
          {log.actor.email ? <span className="text-gray-400"> · {log.actor.email}</span> : null}
        </>
      );
    }
    const attemptedEmail =
      typeof log.meta?.email === 'string' && log.meta.email.trim()
        ? log.meta.email.trim()
        : '';
    return attemptedEmail ? (
      <>
        Attempted user
        <span className="text-gray-400"> · {attemptedEmail}</span>
      </>
    ) : (
      <>System/Anonymous</>
    );
  };

  return (
    <div className="p-6 xl:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            Security Audit
          </h1>
          <p className="text-gray-500 text-sm mt-1">Admin/security actions and failed login attempts</p>
        </div>
        <p className="text-xs text-gray-500">{pagination.total} records</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <select value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a || 'All actions'}</option>
          ))}
        </select>
        <input value={ip} onChange={(e) => { setPage(1); setIp(e.target.value); }} placeholder="Filter by IP" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        <input value={userId} onChange={(e) => { setPage(1); setUserId(e.target.value); }} placeholder="Filter by user id" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">IP</th>
                <th className="text-left px-4 py-3">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No audit records found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {renderActor(log)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {log.targetUser?.name || '—'}
                    {log.targetUser?.email ? <span className="text-gray-400"> · {log.targetUser.email}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{log.ip || '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-600 max-w-[360px] truncate" title={JSON.stringify(log.meta || {})}>
                    {JSON.stringify(log.meta || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {pageText}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-3 rounded border border-gray-200 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={page >= (pagination.totalPages || 1)}
              className="h-8 px-3 rounded border border-gray-200 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
