"use client";

import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const SESSIONS_QUERY_KEY = ["auth-sessions"] as const;

export function ActiveSessionsPanel() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<AuthSession[]>({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => authApi.getSessions().then((r) => r.data.sessions ?? []),
    staleTime: 1000 * 30, // 30 seconds — sessions can change
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => authApi.revokeSession(id),
    onSuccess: () => {
      toast.success("Device signed out.");
      void invalidate();
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Could not sign out device."),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: (res) => {
      toast.success(
        res.data.revoked
          ? `Signed out ${res.data.revoked} other device(s).`
          : "No other active sessions.",
      );
      void invalidate();
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Could not sign out other devices."),
  });

  const revoking = revokeMutation.isPending || revokeOthersMutation.isPending;

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading active devices…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={revoking}
          onClick={() => revokeOthersMutation.mutate()}
          className="uppercase tracking-widest text-[10px] font-semibold"
        >
          Sign out other devices
        </Button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No active sessions found.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/iPhone|iPad|Android/i.test(s.deviceLabel) ? (
                  <Smartphone className="h-5 w-5 text-gray-400 shrink-0" />
                ) : (
                  <Monitor className="h-5 w-5 text-gray-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {s.deviceLabel}
                    {s.current ? (
                      <span className="ml-2 text-xs text-emerald-600 font-normal">
                        This device
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.ip ? `IP ${s.ip} · ` : ""}
                    Active since{" "}
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {!s.current ? (
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(s.id)}
                  disabled={revoking}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  aria-label="Sign out device"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
