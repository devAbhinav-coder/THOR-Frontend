"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_ACCESS_AREAS,
  ADMIN_ACCESS_AREA_DESCRIPTIONS,
  ADMIN_ACCESS_AREA_LABELS,
  ADMIN_ACCESS_PRESET_MARKETING,
  normalizeAdminPermissions,
  type AdminAccessArea,
} from "@/lib/adminAccess";

export type TeamAccessSubmit =
  | { kind: "admin" }
  | { kind: "staff"; adminPermissions: AdminAccessArea[] };

type Props = {
  open: boolean;
  userName: string;
  mode: "create" | "edit";
  initialRole?: "admin" | "staff";
  initialPermissions?: string[];
  onClose: () => void;
  onSubmit: (payload: TeamAccessSubmit) => void;
  submitting?: boolean;
};

export default function AdminTeamAccessModal({
  open,
  userName,
  mode,
  initialRole,
  initialPermissions,
  onClose,
  onSubmit,
  submitting,
}: Props) {
  const [accessKind, setAccessKind] = useState<"admin" | "staff">("staff");
  const [permissions, setPermissions] = useState<AdminAccessArea[]>(
    ADMIN_ACCESS_PRESET_MARKETING,
  );

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRole === "admin") {
      setAccessKind("admin");
      setPermissions([]);
      return;
    }
    if (mode === "edit" && initialRole === "staff") {
      setAccessKind("staff");
      const normalized = normalizeAdminPermissions(initialPermissions);
      setPermissions(
        normalized.length > 0 ? normalized : [...ADMIN_ACCESS_PRESET_MARKETING],
      );
      return;
    }
    setAccessKind("staff");
    setPermissions([...ADMIN_ACCESS_PRESET_MARKETING]);
  }, [open, mode, initialRole, initialPermissions]);

  if (!open) return null;

  const toggleArea = (area: AdminAccessArea) => {
    setPermissions((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const applyMarketingPreset = () => {
    setAccessKind("staff");
    setPermissions([...ADMIN_ACCESS_PRESET_MARKETING]);
  };

  const handleSave = () => {
    if (accessKind === "admin") {
      onSubmit({ kind: "admin" });
      return;
    }
    if (permissions.length === 0) return;
    onSubmit({ kind: "staff", adminPermissions: permissions });
  };

  return (
    <div className='fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4'>
      <button
        type='button'
        className='absolute inset-0 bg-navy-950/55 backdrop-blur-[2px]'
        aria-label='Close'
        onClick={onClose}
      />
      <div className='relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3'>
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
              {mode === "edit" ? "Edit team access" : "Add to team"}
            </p>
            <h3 className='text-lg font-bold font-serif text-gray-900 truncate'>
              {userName}
            </h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='px-5 py-4 overflow-y-auto space-y-4'>
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              onClick={() => setAccessKind("staff")}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                accessKind === "staff" ?
                  "border-brand-300 bg-brand-50 ring-1 ring-brand-200"
                : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <span className='font-semibold text-gray-900'>Team member</span>
              <p className='text-[11px] text-gray-500 mt-0.5'>
                Custom areas only
              </p>
            </button>
            <button
              type='button'
              onClick={() => setAccessKind("admin")}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                accessKind === "admin" ?
                  "border-navy-300 bg-navy-50 ring-1 ring-navy-200"
                : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <span className='font-semibold text-gray-900'>Full admin</span>
              <p className='text-[11px] text-gray-500 mt-0.5'>
                Entire panel + settings
              </p>
            </button>
          </div>

          {accessKind === "staff" && (
            <>
              <button
                type='button'
                onClick={applyMarketingPreset}
                className='text-xs font-semibold text-brand-700 hover:text-brand-800'
              >
                Use marketing preset (storefront + content)
              </button>
              <ul className='space-y-2'>
                {ADMIN_ACCESS_AREAS.map((area) => {
                  const checked = permissions.includes(area);
                  return (
                    <li key={area}>
                      <label
                        className={cn(
                          "flex gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                          checked ?
                            "border-brand-200 bg-brand-50/60"
                          : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        <input
                          type='checkbox'
                          className='mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500'
                          checked={checked}
                          onChange={() => toggleArea(area)}
                        />
                        <span className='min-w-0'>
                          <span className='block text-sm font-semibold text-gray-900'>
                            {ADMIN_ACCESS_AREA_LABELS[area]}
                          </span>
                          <span className='block text-[11px] text-gray-500 leading-snug'>
                            {ADMIN_ACCESS_AREA_DESCRIPTIONS[area]}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className='px-5 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/80'>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={
              submitting ||
              (accessKind === "staff" && permissions.length === 0)
            }
          >
            {submitting ? "Saving…" : "Save access"}
          </Button>
        </div>
      </div>
    </div>
  );
}
