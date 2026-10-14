"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate, getOrderStatusColor, cn } from "@/lib/utils";
import {
  adminReturnChannelLabel,
  RETURN_STATUS_LABELS,
} from "@/lib/orderReturnHelpers";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Download,
  RefreshCw,
  Package,
  Users,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";
import { AdminAiExplainButton } from "@/components/admin/ai";
import toast from "react-hot-toast";

type ReturnOrder = {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  returnStatus?: string | null;
  paymentMethod: string;
  paymentStatus?: string;
  createdAt: string;
  deliveredAt?: string;
  activityAt?: string;
  returnRequest?: {
    reason: string;
    note?: string;
    refundMethod?: string;
    requestedAt?: string;
    requestedBy?: "customer" | "admin";
    requestChannel?: string;
    adminNote?: string;
  };
  refundData?: { amount: number; method: string; processedAt?: string };
  items: { name: string; quantity: number; image: string }[];
  user?: { name: string; email: string; phone?: string };
};

type ReturnsInsights = {
  summary: {
    totalReturnOrders: number;
    requested: number;
    approved: number;
    rejected: number;
    pickedUp?: number;
    received?: number;
    returned: number;
    refundOnly?: number;
    totalRefundedAmount: number;
    refundedOrdersCount: number;
  };
  reasons: { _id: string; count: number }[];
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    returnCount: number;
  }[];
  topCustomers: {
    userId: string;
    name: string;
    email: string;
    returnCount: number;
  }[];
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
  { label: "Picked up", value: "picked_up" },
  { label: "Received", value: "received" },
  { label: "Rejected", value: "rejected" },
  { label: "Returned & refunded", value: "returned" },
  { label: "Refund only (no return)", value: "refund_only" },
];

const RETURN_STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  approved: "bg-sky-100 text-sky-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  received: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  returned: "bg-blue-100 text-blue-800",
  refund_only: "bg-rose-100 text-rose-800",
};

/** Rows with no return record are direct refunds (legacy, cancel or in-transit). */
function rowReturnState(o: ReturnOrder): string {
  const rs = o.returnStatus;
  if (!rs || rs === "none") return "refund_only";
  return rs;
}

function rowReturnLabel(o: ReturnOrder): string {
  const s = rowReturnState(o);
  if (s === "refund_only") return "Refund only";
  return RETURN_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

function rowSource(o: ReturnOrder): string {
  const rr = o.returnRequest;
  if (!rr?.requestedAt) return "Admin refund";
  if (rr.requestedBy === "admin") {
    const ch = adminReturnChannelLabel(rr.requestChannel);
    return ch ? `Admin · ${ch}` : "Admin";
  }
  return "Customer · app";
}

function rowDate(o: ReturnOrder): string {
  return (
    o.activityAt ||
    o.returnRequest?.requestedAt ||
    o.refundData?.processedAt ||
    o.createdAt
  );
}

function escapeCsvCell(s: string) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

export default function AdminReturnsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filter = { page, status: statusFilter, q: search };

  const {
    data: insights,
    isLoading: insightsLoading,
    isError: insightsError,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["admin-returns-insights"],
    queryFn: async () => {
      const res = await adminApi.getReturnsInsights();
      return res.data as ReturnsInsights;
    },
  });

  const {
    data: returnsData,
    isLoading,
    isError: listError,
    refetch: refetchReturns,
  } = useQuery({
    queryKey: ["admin-returns", filter],
    queryFn: async () => {
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await adminApi.getReturns(params);
        return {
          returns: (res.data.orders as ReturnOrder[]) || [],
          total: res.pagination?.total ?? 0,
        };
      } catch (err) {
        toast.error("Could not load returns list.");
        throw err;
      }
    },
  });

  const returns = returnsData?.returns ?? [];
  const total = returnsData?.total ?? 0;

  const maxReason = useMemo(() => {
    if (!insights?.reasons?.length) return 1;
    return Math.max(...insights.reasons.map((r) => r.count), 1);
  }, [insights]);

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const rows: string[][] = [
        [
          "Order",
          "Customer",
          "Email",
          "Phone",
          "Return status",
          "Order status",
          "Source",
          "Reason",
          "Refund method requested",
          "Refunded amount",
          "Refunded via",
          "Order total",
          "Date",
        ],
      ];
      let p = 1;
      let hasMore = true;
      const limit = 50;
      while (hasMore && p <= 100) {
        const res = await adminApi.getReturns({
          page: p,
          limit,
          status: statusFilter || undefined,
          q: search || undefined,
        });
        const batch = (res.data.orders as ReturnOrder[]) || [];
        const pag = res.pagination;
        for (const o of batch) {
          rows.push([
            o.orderNumber,
            o.user?.name || "",
            o.user?.email || "",
            o.user?.phone || "",
            rowReturnLabel(o),
            o.status,
            rowSource(o),
            o.returnRequest?.reason || "",
            o.returnRequest?.refundMethod?.replace(/_/g, " ") || "",
            o.refundData?.amount ? String(o.refundData.amount) : "",
            o.refundData?.method?.replace(/_/g, " ") || "",
            String(o.total),
            rowDate(o),
          ]);
        }
        hasMore = pag.totalPages > p;
        p += 1;
        if (batch.length === 0) hasMore = false;
      }
      const csv = rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
      const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `returns-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    void refetchInsights();
    void refetchReturns();
    void queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
  };

  const summary = insights?.summary;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className='p-4 sm:p-6 xl:p-8 space-y-6 max-w-[1600px] mx-auto'>
      <AdminPageHeader
        title='Returns & refunds'
        description='Track return requests, reasons, and which products or customers are involved most often. Data below is aggregated from all orders (not just this page).'
        actions={
          <>
            <AdminAiExplainButton kind='returns' label='AI explain returns' />
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-xl border-gray-200'
              onClick={handleRefresh}
              disabled={insightsLoading && isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${insightsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-xl border-gray-200'
              onClick={downloadCsv}
              disabled={exporting || listError}
            >
              <Download className='h-4 w-4 mr-2' />
              {exporting ? "Exporting…" : "Download CSV"}
            </Button>
            <Link
              href='/admin/orders'
              className='inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 transition-colors'
            >
              All orders
            </Link>
          </>
        }
      />

      {insightsError && (
        <AdminErrorState
          title='Couldn’t load return insights'
          message='The returns list may still work. Try refresh or check the API.'
          onRetry={() => void refetchInsights()}
        />
      )}

      {/* KPIs - from backend aggregates */}
      <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
        {[
          {
            label: "Open requests",
            value: insightsLoading ? "…" : (summary?.requested ?? 0),
            icon: Clock,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "In progress",
            value:
              insightsLoading ? "…" : (
                (summary?.approved ?? 0) +
                (summary?.pickedUp ?? 0) +
                (summary?.received ?? 0)
              ),
            icon: CheckCircle2,
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Rejected",
            value: insightsLoading ? "…" : (summary?.rejected ?? 0),
            icon: XCircle,
            color: "bg-gray-50 text-gray-600",
          },
          {
            label: "Returned & refunded",
            value: insightsLoading ? "…" : (summary?.returned ?? 0),
            icon: RotateCcw,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Refund only",
            value: insightsLoading ? "…" : (summary?.refundOnly ?? 0),
            icon: TrendingDown,
            color: "bg-rose-50 text-rose-700",
          },
          {
            label: "Refunded (₹)",
            value:
              insightsLoading ? "…" : (
                formatPrice(summary?.totalRefundedAmount ?? 0)
              ),
            icon: TrendingDown,
            color: "bg-rose-50 text-rose-700",
            small: true,
          },
          {
            label: "Orders refunded",
            value: insightsLoading ? "…" : (summary?.refundedOrdersCount ?? 0),
            icon: RotateCcw,
            color: "bg-navy-50 text-navy-800",
          },
        ].map(({ label, value, icon: Icon, color, small }) => (
          <div
            key={label}
            className='bg-white rounded-xl p-4 border border-gray-100 shadow-sm'
          >
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center mb-2",
                color,
              )}
            >
              <Icon className='h-4 w-4' />
            </div>
            <p
              className={cn(
                "font-bold text-gray-900 leading-tight",
                small ? "text-sm sm:text-base" : "text-xl",
              )}
            >
              {value}
            </p>
            <p className='text-[10px] font-semibold text-gray-500 mt-1 uppercase tracking-wide'>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm'>
          <h3 className='font-serif text-lg font-bold text-gray-900 mb-1'>
            Return reasons (all time)
          </h3>
          <p className='text-xs text-gray-500 mb-5'>
            Weighted by number of return requests - same basis as dashboard
            analytics.
          </p>
          {!insightsLoading && insights?.reasons?.length ?
            <div className='space-y-3'>
              {insights.reasons.map(({ _id: reason, count }) => (
                <div key={reason} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm gap-2'>
                    <span className='font-medium text-gray-800 truncate'>
                      {reason}
                    </span>
                    <span className='font-bold text-gray-900 tabular-nums flex-shrink-0'>
                      {count}
                    </span>
                  </div>
                  <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all'
                      style={{ width: `${(count / maxReason) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          : <div className='py-12 text-center text-gray-400 text-sm border border-dashed border-gray-100 rounded-xl'>
              {insightsLoading ?
                "Loading reasons…"
              : "No return reason data yet."}
            </div>
          }
        </div>

        <div className='space-y-6'>
          <div className='bg-white rounded-2xl border border-gray-100 p-5 shadow-sm'>
            <div className='flex items-center gap-2 mb-3'>
              <Package className='h-5 w-5 text-brand-600' />
              <h3 className='font-semibold text-gray-900'>
                Products in return orders
              </h3>
            </div>
            <p className='text-xs text-gray-500 mb-3'>
              Line items counted - a multi-item order adds multiple rows.
            </p>
            {!insightsLoading && insights?.topProducts?.length ?
              <ul className='space-y-2.5'>
                {insights.topProducts.slice(0, 8).map((p, i) => (
                  <li
                    key={p.productId}
                    className='flex items-start justify-between gap-2 text-sm'
                  >
                    <span className='text-gray-400 w-5 flex-shrink-0'>
                      {i + 1}.
                    </span>
                    <span className='flex-1 min-w-0'>
                      <span className='font-medium text-gray-900 line-clamp-2'>
                        {p.name}
                      </span>
                      {p.sku ?
                        <span className='block text-[11px] text-gray-400 font-mono'>
                          {p.sku}
                        </span>
                      : null}
                    </span>
                    <span className='font-bold text-gray-900 tabular-nums flex-shrink-0'>
                      {p.returnCount}
                    </span>
                  </li>
                ))}
              </ul>
            : <p className='text-sm text-gray-400'>
                {insightsLoading ? "Loading…" : "No data yet."}
              </p>
            }
          </div>

          <div className='bg-white rounded-2xl border border-gray-100 p-5 shadow-sm'>
            <div className='flex items-center gap-2 mb-3'>
              <Users className='h-5 w-5 text-navy-700' />
              <h3 className='font-semibold text-gray-900'>
                Customers with most returns
              </h3>
            </div>
            <p className='text-xs text-gray-500 mb-3'>
              By number of return requests (not order value).
            </p>
            {!insightsLoading && insights?.topCustomers?.length ?
              <ul className='space-y-2.5'>
                {insights.topCustomers.slice(0, 8).map((c, i) => (
                  <li
                    key={c.userId || i}
                    className='flex items-start justify-between gap-2 text-sm'
                  >
                    <span className='text-gray-400 w-5 flex-shrink-0'>
                      {i + 1}.
                    </span>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900 truncate'>
                        {c.name}
                      </p>
                      <p className='text-[11px] text-gray-400 truncate'>
                        {c.email}
                      </p>
                    </div>
                    <span className='font-bold text-gray-900 tabular-nums flex-shrink-0'>
                      {c.returnCount}
                    </span>
                  </li>
                ))}
              </ul>
            : <p className='text-sm text-gray-400'>
                {insightsLoading ? "Loading…" : "No data yet."}
              </p>
            }
          </div>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder='Search order number…'
          className='w-full sm:w-64 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
        />
        <p className='text-xs text-gray-500'>
          {isLoading ? "Loading…" : `${total.toLocaleString()} order${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className='flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type='button'
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all",
              statusFilter === tab.value ?
                "bg-gray-900 text-white border-gray-900 shadow-md"
              : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {listError && !isLoading && (
        <AdminErrorState
          title='Couldn’t load returns'
          onRetry={() => void refetchReturns()}
        />
      )}

      {!listError && (
        <div className='bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm'>
          {isLoading ?
            <div className='p-10 text-center text-gray-400 animate-pulse'>
              Loading returns…
            </div>
          : returns.length === 0 ?
            <div className='p-10 text-center'>
              <RotateCcw className='h-10 w-10 text-gray-200 mx-auto mb-3' />
              <p className='text-gray-500 font-medium'>
                {search ?
                  `No returns or refunds match "${search}".`
                : "No returns or refunds for this filter."}
              </p>
            </div>
          : <>
              <div className='hidden sm:block overflow-x-auto'>
                <table className='w-full min-w-[920px] text-sm'>
                  <thead>
                    <tr className='bg-gray-50 text-xs text-gray-500 uppercase tracking-wider'>
                      <th className='text-left px-5 py-3 font-medium'>Order</th>
                      <th className='text-left px-5 py-3 font-medium'>
                        Customer
                      </th>
                      <th className='text-left px-5 py-3 font-medium'>
                        Reason
                      </th>
                      <th className='text-left px-5 py-3 font-medium'>
                        Refund
                      </th>
                      <th className='text-left px-5 py-3 font-medium'>
                        Return
                      </th>
                      <th className='text-left px-5 py-3 font-medium'>Total</th>
                      <th className='text-left px-5 py-3 font-medium'>Date</th>
                      <th className='px-5 py-3' />
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {returns.map((order) => (
                      <tr
                        key={order._id}
                        className='hover:bg-gray-50 transition-colors'
                      >
                        <td className='px-5 py-3.5'>
                          <p className='font-semibold text-brand-600'>
                            {order.orderNumber}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize inline-block mt-0.5",
                              getOrderStatusColor(order.status),
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className='px-5 py-3.5'>
                          <p className='font-medium text-gray-900'>
                            {order.user?.name || "-"}
                          </p>
                          <p className='text-xs text-gray-400 truncate max-w-[200px]'>
                            {order.user?.email || ""}
                          </p>
                          <span className='mt-1 inline-block text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded'>
                            {rowSource(order)}
                          </span>
                        </td>
                        <td className='px-5 py-3.5 max-w-[220px]'>
                          <p className='text-gray-700 truncate'>
                            {order.returnRequest?.reason ||
                              (order.refundData?.amount ?
                                "Refunded without return"
                              : "-")}
                          </p>
                          {order.returnRequest?.note ?
                            <p className='text-xs text-gray-400 truncate'>
                              {order.returnRequest.note}
                            </p>
                          : null}
                        </td>
                        <td className='px-5 py-3.5'>
                          {order.refundData?.amount ?
                            <div>
                              <p className='text-sm font-bold text-gray-900 tabular-nums'>
                                {formatPrice(order.refundData.amount)}
                              </p>
                              <p className='text-[11px] text-gray-500 capitalize'>
                                {String(order.refundData.method || "").replace(
                                  /_/g,
                                  " ",
                                )}
                              </p>
                            </div>
                          : order.returnRequest?.refundMethod ?
                            <span className='text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg capitalize'>
                              Pending ·{" "}
                              {order.returnRequest.refundMethod.replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          : <span className='text-xs text-gray-400'>-</span>}
                        </td>
                        <td className='px-5 py-3.5'>
                          <span
                            className={cn(
                              "text-xs font-semibold px-2.5 py-1 rounded-full",
                              RETURN_STATUS_COLORS[rowReturnState(order)] ||
                                "bg-gray-100 text-gray-700",
                            )}
                          >
                            {rowReturnLabel(order)}
                          </span>
                        </td>
                        <td className='px-5 py-3.5 font-semibold text-gray-900 tabular-nums'>
                          {formatPrice(order.total)}
                        </td>
                        <td className='px-5 py-3.5 text-gray-500'>
                          {formatDate(rowDate(order))}
                        </td>
                        <td className='px-5 py-3.5'>
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className='inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700'
                          >
                            Open <ChevronRight className='h-3.5 w-3.5' />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='sm:hidden divide-y divide-gray-100'>
                {returns.map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className='block px-4 py-4 hover:bg-gray-50'
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div>
                        <p className='text-sm font-bold text-brand-600'>
                          {order.orderNumber}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {order.user?.name || "-"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          RETURN_STATUS_COLORS[rowReturnState(order)] ||
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {rowReturnLabel(order)}
                      </span>
                    </div>
                    <p className='text-xs text-gray-600 mb-1'>
                      <span className='font-medium'>Reason:</span>{" "}
                      {order.returnRequest?.reason ||
                        (order.refundData?.amount ? "Refunded without return" : "-")}
                    </p>
                    <p className='text-[11px] text-gray-500 mb-1'>
                      {rowSource(order)}
                      {order.refundData?.amount ?
                        ` · Refunded ${formatPrice(order.refundData.amount)}`
                      : ""}
                    </p>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-gray-400'>
                        {formatDate(rowDate(order))}
                      </span>
                      <span className='text-sm font-bold text-gray-900'>
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          }
        </div>
      )}

      {total > 20 && !listError && (
        <div className='flex justify-center items-center gap-3 flex-wrap'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='rounded-xl'
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className='text-sm text-gray-600'>
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='rounded-xl'
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
