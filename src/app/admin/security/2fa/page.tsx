"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, Copy, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";
import { Button } from "@/components/ui/button";

type SetupPayload = {
  secret: string;
  qrDataUrl: string;
};

export default function AdminTwoFactorPage() {
  const [enabled, setEnabled] = useState(false);
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await adminApi.getTwoFactorStatus();
      setEnabled(Boolean(res.data.enabled));
      setRequired(Boolean(res.data.required));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await adminApi.setupTwoFactor();
      if (res.data.alreadyEnabled) {
        setEnabled(true);
        toast.success("Two-factor is already enabled");
        return;
      }
      setSetup({ secret: res.data.secret, qrDataUrl: res.data.qrDataUrl });
      setBackupCodes(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    if (!setup || !/^\d{6}$/.test(verifyCode)) {
      toast.error("Enter the 6-digit code from your app");
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.enableTwoFactor({
        secret: setup.secret,
        code: verifyCode,
      });
      setEnabled(true);
      setSetup(null);
      setVerifyCode("");
      setBackupCodes(res.data.backupCodes);
      toast.success("Two-factor authentication enabled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!disablePassword || !disableCode.trim()) {
      toast.error("Password and authenticator/backup code required");
      return;
    }
    setBusy(true);
    try {
      await adminApi.disableTwoFactor({
        password: disablePassword,
        code: disableCode.trim(),
      });
      setEnabled(false);
      setDisablePassword("");
      setDisableCode("");
      setBackupCodes(null);
      toast.success("Two-factor authentication disabled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes?.length) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied");
  };

  if (loadError) {
    return (
      <div className="p-4 sm:p-6">
        <AdminErrorState onRetry={() => void loadStatus()} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <AdminPageHeader
        title="Admin two-factor authentication"
        description="Protect the admin panel with Google Authenticator, Authy, or any TOTP app."
      />

      {loading ? (
        <div className="rounded-xl border bg-white p-8 animate-pulse h-48" />
      ) : (
        <div className="rounded-xl border bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-navy-900">
                Status: {enabled ? "Enabled" : "Not enabled"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {enabled
                  ? "Each admin sign-in requires a 6-digit code from your authenticator app."
                  : required
                    ? "Your deployment requires 2FA — enable it before using other admin tools."
                    : "Recommended for production admin accounts."}
              </p>
            </div>
          </div>

          {backupCodes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Save these backup codes now
              </p>
              <p className="text-xs text-amber-800">
                Each code works once if you lose your phone. Store them somewhere safe.
              </p>
              <pre className="text-xs font-mono bg-white/80 rounded-lg p-3 border border-amber-100 whitespace-pre-wrap">
                {backupCodes.join("\n")}
              </pre>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyBackupCodes()}>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy codes
              </Button>
            </div>
          )}

          {!enabled && !setup && (
            <Button type="button" onClick={() => void startSetup()} disabled={busy}>
              Set up authenticator
            </Button>
          )}

          {setup && (
            <div className="space-y-4 border-t pt-5">
              <p className="text-sm text-gray-700">
                Scan this QR code with your authenticator app, then enter the 6-digit code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="rounded-xl border p-3 bg-white">
                  <Image
                    src={setup.qrDataUrl}
                    alt="Authenticator QR code"
                    width={180}
                    height={180}
                    unoptimized
                  />
                </div>
                <div className="text-xs font-mono break-all text-gray-600 space-y-2">
                  <p className="font-sans text-sm font-medium text-gray-800">Manual key</p>
                  <p>{setup.secret}</p>
                </div>
              </div>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className="h-11 w-full max-w-xs rounded-xl border px-3 text-sm tracking-[0.3em]"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={() => void enable()} disabled={busy}>
                  Enable 2FA
                </Button>
                <Button type="button" variant="outline" onClick={() => setSetup(null)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {enabled && (
            <div className="space-y-3 border-t pt-5">
              <p className="text-sm font-medium text-gray-800">Disable two-factor</p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Your password"
                className="h-11 w-full max-w-md rounded-xl border px-3 text-sm"
              />
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Authenticator or backup code"
                className="h-11 w-full max-w-md rounded-xl border px-3 text-sm"
              />
              <Button type="button" variant="outline" onClick={() => void disable()} disabled={busy}>
                Disable 2FA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
