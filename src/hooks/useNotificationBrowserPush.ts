"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { notificationApi } from "@/lib/api";
import { urlBase64ToUint8Array } from "@/lib/webPush";

const AUTO_PROMPT_SESSION_KEY = "hor_notif_auto_prompt_v1";

type UserLike = { _id?: string } | null | undefined;

async function subscribeWithVapid(user: NonNullable<UserLike>): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  )
    return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const keyRes = await notificationApi.getPushPublicKey();
  const vapidPublicKey = keyRes.data?.publicKey;
  if (keyRes.data?.enabled === false || !vapidPublicKey) return;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as unknown as BufferSource,
    }));
  await notificationApi.subscribePush(subscription.toJSON());
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
      await subscribeWithVapid(user);
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
        return;
      }
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result === "granted") {
          await subscribeWithVapid(user);
          pushSubscribedRef.current = true;
          if (!silent) toast.success("Browser notifications enabled.");
        } else if (result === "denied") {
          try {
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.ready;
              const sub = await reg.pushManager.getSubscription();
              if (sub) await notificationApi.unsubscribePush(sub.endpoint);
            }
          } catch {
            /* ignore */
          }
          if (!silent)
            toast.error(
              "Browser notifications blocked. Enable from browser site settings.",
            );
        }
      } catch {
        if (!silent)
          toast.error("Could not request notification permission.");
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
    notificationApi
      .getPushPublicKey()
      .then((res) => {
        if (cancelled) return;
        const ok =
          res.data?.enabled === true && Boolean(res.data?.publicKey?.trim());
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
    if (!user || pushConfigured !== true) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (autoPromptStartedRef.current) return;
    if (sessionStorage.getItem(AUTO_PROMPT_SESSION_KEY)) return;

    autoPromptStartedRef.current = true;
    sessionStorage.setItem(AUTO_PROMPT_SESSION_KEY, "1");

    void requestPermissionRef.current({ silent: true });
  }, [user, pushConfigured, options?.autoRequestPermissionOnce]);

  return {
    notificationPermission,
    pushConfigured,
    ensurePushSubscription,
    requestBrowserPermission,
  };
}
