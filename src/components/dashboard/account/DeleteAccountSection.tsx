"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Variant = "profile" | "security";

export default function DeleteAccountSection({ variant = "profile" }: { variant?: Variant }) {
  const { logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }
    setIsDeleting(true);
    try {
      await authApi.deleteMe();
      await logout();
      toast.success("Your account has been deleted");
      setIsOpen(false);
      setConfirmText("");
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (variant === "security") {
    return (
      <>
        <div className="bg-red-50/80 border border-red-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 mb-1">
                Danger Zone
              </p>
              <h3 className="font-serif text-lg text-account-primary mb-1">Delete Account</h3>
              <p className="text-sm text-account-on-surface-variant max-w-lg">
                Permanently remove all your personal records, order history, and saved addresses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 border border-red-500 text-red-600 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-red-100 transition-colors"
          >
            Terminate Account
          </button>
        </div>
        {isOpen && <DeleteModal {...{ confirmText, setConfirmText, isDeleting, onDelete, onClose: () => { setIsOpen(false); setConfirmText(""); } }} />}
      </>
    );
  }

  return (
    <>
      <div className="bg-account-surface-container border border-account-outline-variant/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg text-red-600 mb-1">Deactivate Account</h3>
          <p className="text-sm text-account-on-surface-variant">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 border border-red-400 text-red-600 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-red-50 transition-colors"
        >
          Permanently Delete
        </button>
      </div>
      {isOpen && <DeleteModal {...{ confirmText, setConfirmText, isDeleting, onDelete, onClose: () => { setIsOpen(false); setConfirmText(""); } }} />}
    </>
  );
}

function DeleteModal({
  confirmText,
  setConfirmText,
  isDeleting,
  onDelete,
  onClose,
}: {
  confirmText: string;
  setConfirmText: (v: string) => void;
  isDeleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-account-surface-container-lowest border border-account-outline-variant/30 shadow-xl p-6">
        <h3 className="font-serif text-xl text-account-primary">Close your account?</h3>
        <p className="text-sm text-account-on-surface-variant mt-2">
          Type <span className="font-semibold text-account-primary">DELETE</span> to confirm.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
          className={cn(
            "w-full mt-4 bg-transparent border-0 border-b border-account-outline-variant/50 pb-2 text-account-primary focus:outline-none focus:border-account-secondary",
          )}
        />
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={onDelete}
            loading={isDeleting}
            disabled={confirmText !== "DELETE" || isDeleting}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
