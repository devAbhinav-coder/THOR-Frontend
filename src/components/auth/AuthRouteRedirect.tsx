"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { openAuthModalUrl, type AuthModalView } from "@/lib/authModal";
import { safeRedirectPath } from "@/lib/safeRedirect";

type Props = {
  view: AuthModalView;
  /** Path to return to after auth (defaults to /). */
  fallbackPath?: string;
};

export default function AuthRouteRedirect({ view, fallbackPath = "/" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get("redirect");
    const redirect =
      safeRedirectPath(redirectParam?.split("?")[0] || "") ||
      safeRedirectPath(fallbackPath) ||
      "/";
    const targetPath = redirect.split("?")[0] || "/";
    router.replace(openAuthModalUrl(targetPath, "", view, redirect));
  }, [view, fallbackPath, router, searchParams]);

  return (
    <div className='min-h-[40vh] flex items-center justify-center text-sm text-gray-500'>
      Opening…
    </div>
  );
}
