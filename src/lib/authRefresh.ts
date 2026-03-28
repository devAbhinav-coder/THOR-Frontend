import axios from "axios";
import { env } from "@/lib/env";
import { parseApiResponse } from "@/lib/parseApi";
import { authWithUser } from "@/lib/api-schemas";

const refreshClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

let refreshPromise: Promise<boolean> | null = null;

/**
 * Uses httpOnly refresh cookie (no localStorage). Backend sets new access+refresh cookies.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await refreshClient.post("/auth/refresh");
        const body = parseApiResponse("auth.refresh", res.data, authWithUser);
        const { useAuthStore } = await import("@/store/useAuthStore");
        useAuthStore.setState({
          user: body.data.user,
          isAuthenticated: true,
          token: null,
        });
        return true;
      } catch {
        const { useAuthStore: clearStore } = await import("@/store/useAuthStore");
        clearStore.setState({ user: null, token: null, isAuthenticated: false });
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}
