"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { orderApi, storefrontApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Order, StorefrontSettings } from "@/types";
import { INITIAL_ACTIONS, MAX_MESSAGES, OPEN_KEY, RECENT_ORDER_LIMIT, STORAGE_KEY } from "./constants";
import { detectIntent, findOrderIdByNumber } from "./intent";
import { botMessage, formatOrderDetailText, summarizeOrder, userMessage } from "./orderFormat";
import type { ChatMessage, OrderSummary, QuickAction } from "./types";

export function useRaniCareChat() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactEmail, setContactEmail] = useState("hello@houseofrani.in");
  const endRef = useRef<HTMLDivElement | null>(null);
  const recentOrdersRef = useRef<Order[]>([]);

  const welcome = useMemo(
    () =>
      botMessage(
        "Hi! I am RaniCare Concierge. I can show your last 5 orders, help track or cancel (before dispatch), and guide returns, shipping, and payments.",
        INITIAL_ACTIONS,
      ),
    [],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const savedOpen = localStorage.getItem(OPEN_KEY);
      if (savedOpen) setOpen(savedOpen === "1");
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-MAX_MESSAGES));
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages([welcome]);
  }, [welcome]);

  useEffect(() => {
    if (!messages.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, loadingOrders]);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((body) => {
        const settings: StorefrontSettings | undefined = body.data?.settings;
        if (settings?.footer?.contactPhone) setContactPhone(settings.footer.contactPhone);
        if (settings?.footer?.contactEmail) setContactEmail(settings.footer.contactEmail);
      })
      .catch(() => {});
  }, []);

  const pushBot = (text: string, actions?: QuickAction[], orders?: OrderSummary[], delay = 420) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, botMessage(text, actions, orders)].slice(-MAX_MESSAGES));
    }, delay);
  };

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, userMessage(text)].slice(-MAX_MESSAGES));
  };

  const fetchRecentOrders = async (): Promise<Order[]> => {
    const body = await orderApi.getMyOrders({ page: 1, limit: RECENT_ORDER_LIMIT });
    const list = (body.data?.orders || []) as Order[];
    recentOrdersRef.current = list;
    return list;
  };

  const presentOrderList = async (opts: { intro: string; cancelHint?: boolean }) => {
    if (!isAuthenticated) {
      pushBot(
        "Sign in to see your recent orders and manage cancellations securely.",
        [
          { label: "Sign in", value: "sign in" },
          { label: "Shipping policy", value: "shipping policy" },
        ],
      );
      return;
    }

    setLoadingOrders(true);
    try {
      const list = await fetchRecentOrders();
      if (!list.length) {
        pushBot(
          "You do not have any orders yet. When you place one, it will show up here for tracking and support.",
          [
            { label: "Start shopping", value: "open shop" },
            { label: "Shipping info", value: "shipping time" },
          ],
        );
        return;
      }

      const summaries = list.map(summarizeOrder);
      const cancelNote = opts.cancelHint
        ? "\n\nCancellations are only possible while status is Pending or Confirmed (before dispatch). Shipped orders need return/refund support."
        : "";

      pushBot(
        `${opts.intro}\nShowing up to ${RECENT_ORDER_LIMIT} most recent orders.${cancelNote}`,
        [
          { label: "Refresh list", value: "action:recent_orders" },
          { label: "Talk to support", value: "contact support" },
        ],
        summaries,
      );
    } catch {
      pushBot("Could not load your orders right now. Please try again in a moment.", [
        { label: "Try again", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const presentOrderDetail = async (orderId: string) => {
    if (!isAuthenticated) {
      pushBot("Please sign in to view order details.", [{ label: "Sign in", value: "sign in" }]);
      return;
    }

    setLoadingOrders(true);
    try {
      let order = recentOrdersRef.current.find((o) => o._id === orderId);
      if (!order) {
        const ob = await orderApi.getById(orderId);
        order = ob.data?.order as Order;
        if (order) {
          const oid = order._id;
          const rest = recentOrdersRef.current.filter((x) => x._id !== oid);
          recentOrdersRef.current = [order, ...rest].slice(0, RECENT_ORDER_LIMIT);
        }
      }
      if (!order) {
        pushBot("That order was not found on your account. Try refreshing your order list.");
        return;
      }

      const detail = formatOrderDetailText(order);
      const actions: QuickAction[] = [
        { label: "Open order page", value: `open_order:${order._id}` },
        { label: "All orders", value: "action:recent_orders" },
      ];
      if (order.status === "pending" || order.status === "confirmed") {
        actions.unshift({ label: "Cancel this order", value: `cancel_ask:${order._id}` });
      } else {
        actions.unshift({ label: "Need return/help", value: "contact support" });
      }

      pushBot(detail, actions, undefined, 280);
    } catch {
      pushBot("Could not load that order. It may have been removed or the link expired.", [
        { label: "My orders", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const presentCancelConfirm = (orderId: string) => {
    const o = recentOrdersRef.current.find((x) => x._id === orderId);
    if (!o) {
      pushBot("Please open your order list again, then try cancel.", [{ label: "Recent orders", value: "action:recent_orders" }]);
      return;
    }
    if (o.status !== "pending" && o.status !== "confirmed") {
      pushBot(
        `Order ${o.orderNumber} is already ${o.status}. We cannot cancel it from chat at this stage. Contact support for return/refund options.`,
        [{ label: "Contact support", value: "contact support" }],
      );
      return;
    }

    pushBot(
      `Cancel order ${o.orderNumber}?\nThis only works before dispatch. If payment was online, refund timelines follow your bank/Razorpay rules.`,
      [
        { label: "Yes, cancel order", value: `cancel_confirm:${o._id}` },
        { label: "No, keep it", value: "cancel_abort" },
      ],
      undefined,
      200,
    );
  };

  const executeCancel = async (orderId: string) => {
    setLoadingOrders(true);
    try {
      await orderApi.cancel(orderId, "Cancelled via RaniCare Concierge");
      await fetchRecentOrders();
      pushBot(
        "Your order was cancelled successfully. If you were charged online, refund processing will follow gateway/bank timelines (usually a few business days).",
        [
          { label: "View updated orders", value: "action:recent_orders" },
          { label: "Email support", value: "email support" },
        ],
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Cancellation failed.";
      pushBot(
        `${msg} If it already shipped, please contact support for the next steps.`,
        [
          { label: "Recent orders", value: "action:recent_orders" },
          { label: "Talk to support", value: "contact support" },
        ],
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const respondWithIntent = async (rawInput: string) => {
    const intent = detectIntent(rawInput);

    if (intent === "show_orders" || intent === "cancel_help") {
      await presentOrderList({
        intro:
          intent === "cancel_help"
            ? "Pick an order below — open details to cancel if it is still Pending or Confirmed."
            : "Here is what we found on your account.",
        cancelHint: intent === "cancel_help",
      });
      return;
    }

    if (intent === "returns") {
      pushBot(
        "For returns/refunds, share your order number and photos (for damage/wrong item) with support. You can open any recent order below for details.",
        [
          { label: "My recent orders", value: "action:recent_orders" },
          { label: "Talk to support", value: "contact support" },
        ],
      );
      return;
    }

    if (intent === "shipping") {
      pushBot(
        "Standard processing is 1–3 business days and delivery is usually 3–10 business days across India. COD depends on pincode and order value.",
        [
          { label: "Shipping policy", value: "shipping policy" },
          { label: "My orders", value: "action:recent_orders" },
        ],
      );
      return;
    }

    if (intent === "payment") {
      pushBot(
        "If payment failed but money left your account, it usually auto-reverses in 3–7 business days. Share the transaction ID with support if it does not.",
        [{ label: "Talk to support", value: "contact support" }],
      );
      return;
    }

    if (intent === "coupon") {
      pushBot(
        "Coupons may require minimum cart value, valid dates, or first-order rules. Share the code and your cart total if you want me to reason through it.",
        [{ label: "Open cart", value: "open cart" }],
      );
      return;
    }

    if (intent === "sizing") {
      pushBot(
        "Compare your measurements with the size chart on the product page. Between two sizes, pick the larger one for comfort.",
        [{ label: "Browse shop", value: "open shop" }],
      );
      return;
    }

    if (intent === "privacy") {
      pushBot("We use your data for orders, support, security, and improvements — see our Privacy Policy.", [
        { label: "Privacy policy", value: "privacy policy" },
      ]);
      return;
    }

    if (intent === "terms") {
      pushBot("Purchase and website terms are in our Terms of Service.", [{ label: "Read terms", value: "terms policy" }]);
      return;
    }

    if (intent === "contact") {
      pushBot(
        `Reach our team:\nPhone: ${contactPhone}\nEmail: ${contactEmail}\nInclude your order number for fastest help.`,
        [
          { label: "Call", value: "call support" },
          { label: "Email", value: "email support" },
        ],
      );
      return;
    }

    if (isAuthenticated && /\b[A-Z]{2,}[\w#-]*\d{2,}\b/i.test(rawInput.trim())) {
      setLoadingOrders(true);
      try {
        if (!recentOrdersRef.current.length) await fetchRecentOrders();
        const id = findOrderIdByNumber(rawInput, recentOrdersRef.current);
        if (id) {
          await presentOrderDetail(id);
          return;
        }
        pushBot(
          "I could not match that reference to your last orders. Check the order number or open your order list.",
          [{ label: "My recent orders", value: "action:recent_orders" }],
        );
        return;
      } catch {
        pushBot("Could not load orders right now. Try again in a moment.", [
          { label: "Try again", value: "action:recent_orders" },
        ]);
        return;
      } finally {
        setLoadingOrders(false);
      }
    }

    if (isAuthenticated && recentOrdersRef.current.length) {
      const id = findOrderIdByNumber(rawInput, recentOrdersRef.current);
      if (id) {
        await presentOrderDetail(id);
        return;
      }
    }

    pushBot(
      "Tell me if you need order tracking, cancellation (before dispatch), returns, shipping, or payments — or tap a quick action below.",
      INITIAL_ACTIONS,
    );
  };

  const handleAction = async (value: string) => {
    if (value === "action:recent_orders") {
      pushUser("Show my recent orders");
      await presentOrderList({ intro: "Here is what we found on your account." });
      return;
    }
    if (value === "action:cancel_help") {
      pushUser("I want to cancel an order");
      await presentOrderList({
        intro: "Pick an order to review. You can cancel from details if status is Pending or Confirmed.",
        cancelHint: true,
      });
      return;
    }
    if (value.startsWith("order_pick:")) {
      const id = value.slice("order_pick:".length);
      pushUser(`Open order details`);
      await presentOrderDetail(id);
      return;
    }
    if (value.startsWith("cancel_ask:")) {
      const id = value.slice("cancel_ask:".length);
      pushUser("I want to cancel this order");
      presentCancelConfirm(id);
      return;
    }
    if (value.startsWith("cancel_confirm:")) {
      const id = value.slice("cancel_confirm:".length);
      pushUser("Confirm cancellation");
      await executeCancel(id);
      return;
    }
    if (value === "cancel_abort") {
      pushUser("Do not cancel");
      pushBot("No problem — your order stays as is. Need anything else?", INITIAL_ACTIONS, undefined, 250);
      return;
    }
    if (value.startsWith("open_order:")) {
      window.location.href = `/dashboard/orders/${value.slice("open_order:".length)}`;
      return;
    }

    if (value === "open orders") window.location.href = "/dashboard/orders";
    else if (value === "open cart") window.location.href = "/cart";
    else if (value === "open shop") window.location.href = "/shop";
    else if (value === "shipping policy") window.location.href = "/shipping";
    else if (value === "privacy policy") window.location.href = "/privacy";
    else if (value === "terms policy") window.location.href = "/terms";
    else if (value === "sign in") window.location.href = "/auth/login";
    else if (value === "call support") window.location.href = `tel:${contactPhone.replace(/\s+/g, "")}`;
    else if (value === "email support")
      window.location.href = `mailto:${contactEmail}?subject=Customer%20Support%20Request`;
    else await submitUserText(value);
  };

  const submitUserText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing || loadingOrders) return;
    setInput("");
    setMessages((prev) => [...prev, userMessage(trimmed)].slice(-MAX_MESSAGES));
    await respondWithIntent(trimmed);
  };

  return {
    open,
    setOpen,
    typing,
    loadingOrders,
    input,
    setInput,
    messages,
    endRef,
    contactPhone,
    contactEmail,
    handleAction,
    submitUserText,
  };
}
