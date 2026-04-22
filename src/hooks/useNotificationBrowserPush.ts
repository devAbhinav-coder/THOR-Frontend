"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { notificationApi } from "@/lib/api";
import { urlBase64ToUint8Array } from "@/lib/webPush";

const AUTO_PROMPT_SESSION_KEY = "hor_notif_auto_prompt_v1";
const PUSH_PUBLIC_KEY_CACHE_MS = 5 * 60 * 1000;

type UserLike = { _id?: string } | null | undefined;

let pushPublicKeyCache:
  | { enabled: boolean; publicKey: string; expiresAt: number }
  | null = null;
let pushPublicKeyInFlight:
  | Promise<{ enabled: boolean; publicKey: string }>
  | null = null;
const pushSubscribedUsers = new Set<string>();
const pushSubscribeInFlightByUser = new Map<string, Promise<void>>();
const syncedEndpointKeys = new Set<string>();

async function getPushPublicConfig(): Promise<{
  enabled: boolean;
  publicKey: string;
}> {
  const now = Date.now();
  if (pushPublicKeyCache && now < pushPublicKeyCache.expiresAt) {
    return {
      enabled: pushPublicKeyCache.enabled,
      publicKey: pushPublicKeyCache.publicKey,
    };
  }
  if (!pushPublicKeyInFlight) {
    pushPublicKeyInFlight = notificationApi
      .getPushPublicKey()
      .then((res) => {
        const enabled = res.data?.enabled === true;
        const publicKey = (res.data?.publicKey || "").trim();
        pushPublicKeyCache = {
          enabled,
          publicKey,
          expiresAt: Date.now() + PUSH_PUBLIC_KEY_CACHE_MS,
        };
        return { enabled, publicKey };
      })
      .finally(() => {
        pushPublicKeyInFlight = null;
      });
  }
  return pushPublicKeyInFlight;
}

async function subscribeWithVapid(user: NonNullable<UserLike>): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  )
    return;
  if (Notification.permission !== "granted") return;
  const userId = String(user?._id || "");
  if (!userId) return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const { enabled, publicKey } = await getPushPublicConfig();
  if (!enabled || !publicKey) return;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        publicKey,
      ) as unknown as BufferSource,
    }));
  const endpoint = subscription.endpoint || "";
  const endpointKey = `${userId}::${endpoint}`;
  if (endpoint && syncedEndpointKeys.has(endpointKey)) return;
  await notificationApi.subscribePush(subscription.toJSON());
  if (endpoint) syncedEndpointKeys.add(endpointKey);
}

async function ensureUserPushSubscription(
  user: NonNullable<UserLike>,
): Promise<void> {
  const userId = String(user?._id || "");
  if (!userId) return;
  if (pushSubscribedUsers.has(userId)) return;
  const existing = pushSubscribeInFlightByUser.get(userId);
  if (existing) {
    await existing;
    return;
  }
  const run = subscribeWithVapid(user)
    .then(() => {
      pushSubscribedUsers.add(userId);
    })
    .finally(() => {
      pushSubscribeInFlightByUser.delete(userId);
    });
  pushSubscribeInFlightByUser.set(userId, run);
  await run;
}

/**
 * Browser notification permission + push subscription for logged-in users.
 * Optionally attempts one automatic permission request per session (best-effort; some browsers still require a tap).
 */
export function useNotificationBrowserPush(
  user: UserLike,
  options?: { autoRequestPermissionOnce?: boolean },
) {
  const pushSubscribedRef = useRef(false);
  const autoPromptStartedRef = useRef(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [pushConfigured, setPushConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    pushSubscribedRef.current = false;
  }, [user?._id]);

  const ensurePushSubscription = useCallback(async () => {
    if (typeof window === "undefined" || !user) return;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    )
      return;
    if (Notification.permission !== "granted") return;
    if (pushSubscribedRef.current) return;
    try {
      await ensureUserPushSubscription(user);
      pushSubscribedRef.current = true;
    } catch {
      // silent fail: in-app notifications still work
    }
  }, [user]);

  const requestBrowserPermission = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      const silent = opts?.silent === true;
      if (typeof window === "undefined" || !("Notification" in window)) {
        if (!silent)
          toast.error(
            "Browser notifications are not supported on this device/browser.",
          );
        return "unsupported" as const;
      }
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result === "granted") {
          await ensureUserPushSubscription(user);
          pushSubscribedRef.current = true;
          if (!silent) toast.success("Browser notifications enabled.");
        } else if (result === "denied") {
          try {
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.ready;
              const sub = await reg.pushManager.getSubscription();
              if (sub) await notificationApi.unsubscribePush(sub.endpoint);
              if (sub?.endpoint) {
                syncedEndpointKeys.forEach((key) => {
                  if (key.endsWith(`::${sub.endpoint}`))
                    syncedEndpointKeys.delete(key);
                });
              }
            }
          } catch {
            /* ignore */
          }
          if (!silent)
            toast.error(
              "Browser notifications blocked. Enable from browser site settings.",
            );
        }
        return result;
      } catch {
        if (!silent)
          toast.error("Could not request notification permission.");
        return null;
      }
    },
    [user],
  );

  /** Discover whether server has VAPID configured (for showing prompts). */
  useEffect(() => {
    if (!user) {
      setPushConfigured(null);
      return;
    }
    let cancelled = false;
    getPushPublicConfig()
      .then((res) => {
        if (cancelled) return;
        const ok = res.enabled === true && Boolean(res.publicKey);
        setPushConfigured(ok);
      })
      .catch(() => {
        if (!cancelled) setPushConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const requestPermissionRef = useRef(requestBrowserPermission);
  requestPermissionRef.current = requestBrowserPermission;

  /** One automatic permission ask per browser session when push is configured (best-effort; many browsers still require a tap). */
  useEffect(() => {
    if (!options?.autoRequestPermissionOnce) return;
    const userId = String(user?._id || "");
    if (!userId || pushConfigured !== true) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (autoPromptStartedRef.current) return;
    const sessionKey = `${AUTO_PROMPT_SESSION_KEY}:${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    autoPromptStartedRef.current = true;
    void requestPermissionRef.current({ silent: true }).then((result) => {
      if (result === "granted" || result === "denied") {
        sessionStorage.setItem(sessionKey, "1");
        return;
      }
      // If browser ignored non-gesture auto prompt and stayed "default",
      // allow a later retry instead of blocking the full session.
      autoPromptStartedRef.current = false;
    });
  }, [user, pushConfigured, options?.autoRequestPermissionOnce]);

  return {
    notificationPermission,
    pushConfigured,
    ensurePushSubscription,
    requestBrowserPermission,
  };
}
