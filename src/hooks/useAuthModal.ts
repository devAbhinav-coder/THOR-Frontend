"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { openAuthModalUrl, type AuthModalView } from "@/lib/authModal";

export function useAuthModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();

  const href = useCallback(
    (view: AuthModalView, redirectPath?: string) =>
      openAuthModalUrl(pathname, search, view, redirectPath),
    [pathname, search],
  );

  const open = useCallback(
    (view: AuthModalView, redirectPath?: string) => {
      router.push(openAuthModalUrl(pathname, search, view, redirectPath), {
        scroll: false,
      });
    },
    [pathname, router, search],
  );

  return useMemo(
    () => ({
      href,
      open,
      loginHref: href("login"),
      signupHref: href("signup"),
      forgotHref: href("forgot"),
    }),
    [href, open],
  );
}
