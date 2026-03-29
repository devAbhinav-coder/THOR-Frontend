"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Box, PackageOpen, AlertCircle, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch notifications with "live" polling (every 15s for admin, 30s for user)
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll({ limit: 50 }),
    enabled: !!user,
    refetchInterval: user?.role === "admin" ? 15000 : 30000,
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications cleared");
      setIsOpen(false);
    },
  });

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) markAsReadMutation.mutate(id);
    setIsOpen(false);
  };

  const IconForType = (type: string) => {
    switch (type) {
      case "order": return <PackageOpen className="w-5 h-5 text-blue-500" />;
      case "alert": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-emerald-500" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-primary/80 hover:text-primary transition-colors focus:outline-none rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Bell className="w-6 h-6" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute mt-3 w-80 md:w-96 rounded-2xl bg-white dark:bg-neutral-900 border shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200",
          align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
        )}>
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/50 dark:bg-neutral-800/50 border-b backdrop-blur-md">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  title="Mark all as read"
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  title="Clear all"
                  onClick={() => clearAllMutation.mutate()}
                  className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">All caught up!</p>
                <p className="text-xs text-neutral-500 mt-1">You have no new notifications.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {notifications.map((n: any) => (
                  <Link
                    key={n._id}
                    href={n.link || "#"}
                    onClick={(e) => {
                      if (!n.link) e.preventDefault();
                      handleNotificationClick(n._id, n.isRead);
                    }}
                    className={cn(
                      "flex items-start gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors relative group",
                      !n.isRead ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    <div className={cn("mt-1 p-2 rounded-full", !n.isRead ? "bg-white dark:bg-neutral-800 shadow-sm" : "bg-neutral-100 dark:bg-neutral-800")}>
                      {IconForType(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm transition-colors", !n.isRead ? "font-semibold text-neutral-900 dark:text-white" : "font-medium text-neutral-700 dark:text-neutral-300")}>
                        {n.title}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1.5 font-medium">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 bg-neutral-50/50 border-t items-center justify-center flex">
               <span className="text-xs text-neutral-400">End of notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
