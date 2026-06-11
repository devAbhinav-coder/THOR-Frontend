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
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback(() => {
    const w = hostRef.current?.clientWidth ?? 0;
    if (w > 0) setWidth(Math.floor(w));
  }, []);

  useEffect(() => {
    updateWidth();
    setReady(true);
  }, [updateWidth]);

  useEffect(() => {
    if (!ready) return;
    const host = hostRef.current;
    if (!host || typeof window === "undefined") return;
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(host);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [ready, updateWidth]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "auth-google-slot h-10 w-full",
        width > 0 ? "opacity-100" : "opacity-0",
      )}
    >
      {ready && width > 0 ?
        <GoogleLogin
          theme="outline"
          size="large"
          width={width}
          text={mode === "signup" ? "signup_with" : "continue_with"}
          shape="rectangular"
          logo_alignment="center"
          use_fedcm_for_button={false}
          onSuccess={(cred) => onSuccess(cred.credential)}
          onError={onError}
          containerProps={{
            className: "auth-google-slot__btn",
            style: { height: 40, width, maxWidth: width, margin: "0 auto" },
          }}
        />
      : null}
    </div>
  );
}
