"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  AuthFormRoot,
  AuthFormHeader,
  AuthBackButton,
} from "@/components/auth/AuthFormChrome";
import { authFieldLabel } from "@/lib/authHeritageTheme";
import { authPrimaryBtn } from "@/lib/authFormShell";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
  embedded?: boolean;
  pendingToken: string;
  email?: string;
  name?: string;
  onSuccess: () => void;
  onBack: () => void;
};

export default function AdminTwoFactorLoginStep({
  embedded = false,
  pendingToken,
  email,
  name,
  onSuccess,
  onBack,
}: Props) {
  const { verifyAdmin2FA, isLoading } = useAuthStore();
  const [backupMode, setBackupMode] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");

  const submit = async () => {
    const code = backupMode ? backupCode.trim() : totpCode.replace(/\s/g, "");
    if (!code) {
      toast.error(backupMode ? "Enter a backup code" : "Enter the 6-digit code");
      return;
    }
    try {
      await verifyAdmin2FA(pendingToken, code);
      toast.success("Admin access verified");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    }
  };

  return (
    <AuthFormRoot embedded={embedded}>
      <AuthBackButton embedded={embedded} onClick={onBack}>
        Back to sign in
      </AuthBackButton>
      <AuthFormHeader
        embedded={embedded}
        title="Admin two-factor"
        subtitle={
          name || email
            ? `Enter the code from your authenticator app${email ? ` for ${email}` : ""}.`
            : "Enter the code from your authenticator app."
        }
        icon={<ShieldCheck className="h-5 w-5" />}
      />
      <div className="space-y-4">
        {!backupMode ? (
          <div className="space-y-2">
            <label className={authFieldLabel(embedded)}>Authenticator code</label>
            <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
              <InputOTPGroup className="w-full justify-between gap-1 sm:gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        ) : (
          <div className="space-y-2">
            <label className={authFieldLabel(embedded)}>Backup code</label>
            <input
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm tracking-widest uppercase"
              placeholder="XXXX-XXXX"
              maxLength={9}
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
            />
          </div>
        )}
        <button type="button" disabled={isLoading} onClick={() => void submit()} className={authPrimaryBtn()}>
          {isLoading ? "Verifying…" : "Verify & continue"}
        </button>
        <button
          type="button"
          className="w-full text-center text-xs text-gray-500 hover:text-gray-800"
          onClick={() => setBackupMode((v) => !v)}
        >
          {backupMode ? "Use authenticator app instead" : "Use a backup code instead"}
        </button>
      </div>
    </AuthFormRoot>
  );
}
