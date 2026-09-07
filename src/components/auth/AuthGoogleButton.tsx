"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { cn } from "@/lib/utils";

type Props = {
  mode: "login" | "signup";
  onSuccess: (credential?: string) => void;
  onError: () => void;
};

export default function AuthGoogleButton({ mode, onSuccess, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback(() => {
    const w = hostRef.current?.clientWidth ?? 0;
    if (w > 0) setWidth(Math.floor(w));
  }, []);

  useEffect(() => {
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    return () => clearTimeout(timer);
  }, [updateWidth]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === "undefined") return;
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(host);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [updateWidth]);

  // Google GSI requires minimum ~240px width to render text label ("Continue with Google").
  // If width is 0 or too small initially (e.g. during modal open animation), default to 360px.
  const effectiveWidth = Math.max(250, Math.min(width || 360, 400));

  return (
    <div
      ref={hostRef}
      className={cn("auth-google-slot h-10 w-full flex justify-center")}
    >
      <GoogleLogin
        key={`${mode}_${effectiveWidth}`}
        theme="outline"
        size="large"
        width={effectiveWidth}
        text={mode === "signup" ? "signup_with" : "continue_with"}
        shape="rectangular"
        logo_alignment="left"
        use_fedcm_for_button={false}
        onSuccess={(cred) => onSuccess(cred.credential)}
        onError={onError}
        containerProps={{
          className: "auth-google-slot__btn",
          style: { height: 40, width: "100%", maxWidth: "100%", margin: "0 auto" },
        }}
      />
    </div>
  );
}
