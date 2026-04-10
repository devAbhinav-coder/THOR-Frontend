import type { InternalAxiosRequestConfig } from "axios";

/** If the request URL includes any of these, 401 handling skips token refresh / login redirect. */
const AUTH_PUBLIC_PATH_FRAGMENTS = [
  "/auth/login",
  "/auth/signup",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/refresh",
] as const;

export function isAuthPublicRequest(config: InternalAxiosRequestConfig): boolean {
  const path = config.url || "";
  return AUTH_PUBLIC_PATH_FRAGMENTS.some((fragment) => path.includes(fragment));
}

/** Session probe: guests get 401; never send them to the login page for this. */
export function isAuthMeRequest(config: InternalAxiosRequestConfig): boolean {
  const path = (config.url || "").split("?")[0];
  return path === "/auth/me" || path === "auth/me" || path.endsWith("/auth/me");
}
