"use client";

import Link from "next/link";
import { Laptop, ArrowRight } from "lucide-react";
import { ActiveSessionsPanel } from "@/components/auth/ActiveSessionsPanel";

export default function ActiveDevicesWidget({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Laptop className="h-4 w-4 text-account-secondary" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-account-primary">
            Active Devices
          </h3>
        </div>
        <p className="text-sm text-account-on-surface-variant mb-4">
          Review where your account is signed in and sign out unfamiliar sessions.
        </p>
        <Link
          href="/dashboard/security"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-account-secondary hover:underline"
        >
          Manage Sessions <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Laptop className="h-5 w-5 text-account-secondary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif text-xl text-account-primary">Active devices</h3>
            <p className="text-sm text-account-on-surface-variant mt-1">
              Sessions where you are currently signed in
            </p>
          </div>
        </div>
      </div>
      <ActiveSessionsPanel />
    </div>
  );
}
