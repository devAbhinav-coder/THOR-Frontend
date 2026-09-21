"use client";

import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileAvatarImg from "@/components/shared/ProfileAvatarImg";

type AdminUserAvatarProps = {
  name: string;
  avatar?: string | null;
  adminNote?: string | null;
  size?: "sm" | "md" | "lg";
  showNoteBadge?: boolean;
};

export default function AdminUserAvatar({
  name,
  avatar,
  adminNote,
  size = "md",
  showNoteBadge = true,
}: AdminUserAvatarProps) {
  const dim =
    size === "lg" ? "h-16 w-16 text-xl"
    : size === "sm" ? "h-9 w-9 text-sm"
    : "h-11 w-11 text-base";

  const hasNote = showNoteBadge && Boolean(adminNote?.trim());

  return (
    <div className='relative shrink-0'>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md",
          dim,
        )}
      >
        <ProfileAvatarImg
          name={name}
          avatar={avatar}
          initialsClassName='text-brand-700 font-bold'
        />
      </div>
      {hasNote ?
        <span
          className='absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm'
          title='Has admin note'
        >
          <StickyNote className='h-2.5 w-2.5 text-amber-950' aria-hidden />
        </span>
      : null}
    </div>
  );
}
