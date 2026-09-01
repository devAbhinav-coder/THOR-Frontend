"use client";

import { useMemo } from "react";
import { Instagram } from "lucide-react";
import {
  isValidInstagramReelUrl,
  normalizeInstagramReelUrl,
} from "@/lib/instagramReel";
import { cn } from "@/lib/utils";
import { adminOfferInputCls } from "@/components/admin/shared/AdminOfferFormUi";

type ProductMotionReelFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasUploadedVideo?: boolean;
};

export function ProductMotionReelField({
  value,
  onChange,
  disabled,
  hasUploadedVideo,
}: ProductMotionReelFieldProps) {
  const trimmed = value.trim();
  const valid = trimmed ? isValidInstagramReelUrl(trimmed) : null;
  const normalized = useMemo(
    () => (trimmed ? normalizeInstagramReelUrl(trimmed) : null),
    [trimmed],
  );

  return (
    <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-sm">
          <Instagram className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Or paste Instagram Reel link
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            Copy link from Instagram → Share → Copy link. Used on PDP only when
            no uploaded motion video is set.
          </p>
        </div>
      </div>

      <input
        className={cn(
          adminOfferInputCls,
          valid === false && trimmed ? "border-red-300 focus:border-red-400" : "",
          valid === true ? "border-emerald-300 focus:border-emerald-400" : "",
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="https://www.instagram.com/reel/ABC123xyz/"
      />

      {trimmed && valid === false ?
        <p className="text-xs font-medium text-red-600">
          Paste a valid public Instagram reel link.
        </p>
      : null}

      {valid && normalized ?
        <p className="text-xs text-emerald-700">
          Reel linked
          {hasUploadedVideo ?
            " — uploaded video will show first on the storefront."
          : " — this reel will show in See in Motion."}
        </p>
      : null}
    </div>
  );
}
