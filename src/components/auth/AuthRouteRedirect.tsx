"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { openAuthModalUrl, type AuthModalView } from "@/lib/authModal";
import { safeRedirectPath } from "@/lib/safeRedirect";

type Props = {
  view: AuthModalView;
  /** Path to return to after auth (defaults to /). */
  fallbackPath?: string;
};

const VIEW_LABEL: Record<AuthModalView, string> = {
  login: "Sign in",
  signup: "Create account",
  forgot: "Reset password",
};

export default function AuthRouteRedirect({ view, fallbackPath = "/" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { targetPath, modalUrl } = useMemo(() => {
    const redirectParam = searchParams.get("redirect");
    const pathOnly =
      safeRedirectPath(redirectParam?.split("?")[0] || "") ||
      safeRedirectPath(fallbackPath) ||
      "/";

    let fullRedirect = pathOnly;
    if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
      const base = safeRedirectPath(redirectParam.split("?")[0]);
      if (base) {
        fullRedirect = redirectParam.split("#")[0] || base;
      }
    }

    const pathname = fullRedirect.split("?")[0] || "/";
    const existingQuery = fullRedirect.includes("?")
      ? fullRedirect.slice(fullRedirect.indexOf("?") + 1)
      : "";

    return {
      targetPath: pathname,
      modalUrl: openAuthModalUrl(pathname, existingQuery, view, fullRedirect),
    };
  }, [view, fallbackPath, searchParams]);

  useEffect(() => {
    router.replace(modalUrl);
  }, [modalUrl, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-gray-600">Opening {VIEW_LABEL[view].toLowerCase()}…</p>
      <Link
        href={modalUrl}
        className="text-sm font-semibold text-brand-700 underline underline-offset-4"
      >
        Continue to {VIEW_LABEL[view]}
      </Link>
      {targetPath !== "/" && (
        <p className="text-xs text-gray-500">
          You will return to{" "}
          <span className="font-medium text-gray-700">{targetPath}</span> after signing in.
        </p>
      )}
    </div>
  );
}
