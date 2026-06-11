"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Users } from "lucide-react";
import { adminApi } from "@/lib/api";

type Subscriber = {
  _id?: string;
  email: string;
  source?: string;
  isActive?: boolean;
  createdAt?: string;
};

function sourceLabel(source?: string) {
  if (source === "blog_detail") return "Article page";
  if (source === "blog_listing") return "Blog listing";
  return source || "—";
}

export default function AdminNewsletterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter", page, search, activeFilter],
    queryFn: () =>
      adminApi.getNewsletterSubscribers({
        page,
        limit: 20,
        search: search.trim() || undefined,
        active: activeFilter,
      }),
  });

  const subscribers = (data?.data?.subscribers ?? []) as Subscriber[];
  const activeCount = data?.data?.activeCount ?? 0;
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
            <Mail className="w-6 h-6 text-rose-600" />
            Journal subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Emails from The Inner Circle subscribe form on blog pages.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold">
          <Users className="w-4 h-4" />
          {activeCount} active
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as "all" | "true" | "false");
            setPage(1);
          }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ?
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    Loading subscribers…
                  </td>
                </tr>
              : subscribers.length === 0 ?
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No subscribers yet.
                  </td>
                </tr>
              : subscribers.map((row) => (
                  <tr key={row._id || row.email} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600">{sourceLabel(row.source)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          row.isActive !== false ?
                            "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-semibold uppercase text-gray-600 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs font-semibold uppercase text-gray-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
