"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isUsableAvatarUrl, profileInitial } from "@/lib/profileAvatar";

type ProfileAvatarImgProps = {
  name: string;
  avatar?: string | null;
  imgClassName?: string;
  initialsClassName?: string;
  /** Reset failed state when user changes */
  resetKey?: string;
};

/** Avatar photo with automatic fallback to initial (Google CDN / broken URLs safe). */
export default function ProfileAvatarImg({
  name,
  avatar,
  imgClassName = "h-full w-full object-cover",
  initialsClassName,
  resetKey,
}: ProfileAvatarImgProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarUrl = isUsableAvatarUrl(avatar);
  const showImage = Boolean(avatarUrl && !imgFailed);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl, name, resetKey]);

  if (showImage && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=''
        className={imgClassName}
        loading='lazy'
        decoding='async'
        referrerPolicy='no-referrer'
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span className={cn("select-none", initialsClassName)} aria-hidden>
      {profileInitial(name)}
    </span>
  );
}
