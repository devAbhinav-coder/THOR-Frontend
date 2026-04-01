"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { orderApi, storefrontApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Order, StorefrontSettings } from "@/types";
import { INITIAL_ACTIONS, MAX_MESSAGES, OPEN_KEY, RECENT_ORDER_LIMIT, STORAGE_KEY } from "./constants";
import { detectIntent, findOrderIdByNumber } from "./intent";
import { botMessage, formatOrderDetailText, summarizeOrder, userMessage } from "./orderFormat";
import type { ChatMessage, OrderSummary, QuickAction } from "./types";

const SUPPORT_PHONE = "834031103";
const SUPPORT_EMAIL = "hello@thehouseofrani@gmail.com";

export function useRaniCareChat() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contactPhone] = useState(SUPPORT_PHONE);
  const [contactEmail] = useState(SUPPORT_EMAIL);
  const endRef = useRef<HTMLDivElement | null>(null);
  const recentOrdersRef = useRef<Order[]>([]);

  const welcome = useMemo(
    () =>
      botMessage(
        "Welcome. I can help with your recent orders, delivery status, cancellations before dispatch, returns, and payments. Choose an option below or type your question.",
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
      pushBot("Please sign in to view your orders and request a cancellation.", [
        { label: "Sign in", value: "sign in" },
        { label: "Shipping information", value: "shipping policy" },
      ]);
      return;
    }

    setLoadingOrders(true);
    try {
      const list = await fetchRecentOrders();
      if (!list.length) {
        pushBot("You have no orders yet. After you place an order, it will appear here for tracking.", [
          { label: "Continue shopping", value: "open shop" },
          { label: "Delivery information", value: "shipping time" },
        ]);
        return;
      }

      const summaries = list.map(summarizeOrder);
      const cancelNote = opts.cancelHint
        ? "\n\nCancellations are available only while your order is pending or confirmed (before dispatch). For shipped orders, please contact us about returns."
        : "";

      pushBot(
        `${opts.intro}\nUp to ${RECENT_ORDER_LIMIT} recent orders are shown below.${cancelNote}`,
        [
          { label: "Refresh", value: "action:recent_orders" },
          { label: "Contact support", value: "contact support" },
        ],
        summaries,
      );
    } catch {
      pushBot("We could not load your orders. Please try again shortly.", [
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
        pushBot("That order was not found on your account. Refresh your order list and try again.");
        return;
      }

      const detail = formatOrderDetailText(order);
      const actions: QuickAction[] = [
        { label: "View on website", value: `open_order:${order._id}` },
        { label: "All orders", value: "action:recent_orders" },
      ];
      if (order.status === "pending" || order.status === "confirmed") {
        actions.unshift({ label: "Cancel this order", value: `cancel_ask:${order._id}` });
      } else {
        actions.unshift({ label: "Need return/help", value: "contact support" });
      }

      pushBot(detail, actions, undefined, 280);
    } catch {
      pushBot("We could not load that order. It may no longer be available.", [
        { label: "My orders", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const presentCancelConfirm = (orderId: string) => {
    const o = recentOrdersRef.current.find((x) => x._id === orderId);
    if (!o) {
      pushBot("Open your order list again, then try to cancel.", [{ label: "Recent orders", value: "action:recent_orders" }]);
      return;
    }
    if (o.status !== "pending" && o.status !== "confirmed") {
      pushBot(
        `Order ${o.orderNumber} is already ${o.status}. It cannot be cancelled here. Please contact us for returns or refunds.`,
        [{ label: "Contact support", value: "contact support" }],
      );
      return;
    }

    pushBot(
      `Cancel order ${o.orderNumber}?\nThis is only available before dispatch. Refunds for online payments follow your bank or card issuer’s timeline.`,
      [
        { label: "Yes, cancel", value: `cancel_confirm:${o._id}` },
        { label: "No, keep order", value: "cancel_abort" },
      ],
      undefined,
      200,
    );
  };

  const executeCancel = async (orderId: string) => {
    setLoadingOrders(true);
    try {
      await orderApi.cancel(orderId, "Cancelled via customer support chat");
      await fetchRecentOrders();
      pushBot(
        "Your order has been cancelled. If you paid online, your refund will be processed according to your bank or card issuer—typically within a few business days.",
        [
          { label: "View orders", value: "action:recent_orders" },
          { label: "Email us", value: "email support" },
        ],
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Cancellation failed.";
      pushBot(`${msg} If your order has shipped, contact us for the next steps.`, [
        { label: "Recent orders", value: "action:recent_orders" },
        { label: "Contact support", value: "contact support" },
      ]);
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
            ? "Select an order below. You can cancel from the details if the status is still pending or confirmed."
            : "Here are your recent orders.",
        cancelHint: intent === "cancel_help",
      });
      return;
    }

    if (intent === "returns") {
      pushBot(
        "For returns or refunds, contact us with your order number. For damaged or incorrect items, photos help us assist you faster. Open a recent order below for details.",
        [
          { label: "My orders", value: "action:recent_orders" },
          { label: "Contact support", value: "contact support" },
        ],
      );
      return;
    }

    if (intent === "shipping") {
      pushBot(
        "Orders are usually processed within 1–3 business days. Delivery within India typically takes 3–10 business days. Cash on delivery may vary by location.",
        [
          { label: "Shipping policy", value: "shipping policy" },
          { label: "My orders", value: "action:recent_orders" },
        ],
      );
      return;
    }

    if (intent === "payment") {
      pushBot(
        "If a payment failed but an amount was debited, it usually reverses within 3–7 business days. If it does not, contact us with your transaction reference.",
        [{ label: "Contact support", value: "contact support" }],
      );
      return;
    }

    if (intent === "coupon") {
      pushBot(
        "Promotional codes may require a minimum order value, valid dates, or apply only to first-time purchases. Apply your code at checkout, or contact us if it is not accepted.",
        [{ label: "View cart", value: "open cart" }],
      );
      return;
    }

    if (intent === "sizing") {
      pushBot(
        "Please compare your measurements with the size chart on the product page. If you are between sizes, the larger size is often more comfortable.",
        [{ label: "Shop", value: "open shop" }],
      );
      return;
    }

    if (intent === "privacy") {
      pushBot("How we use your information is described in our privacy policy.", [
        { label: "Privacy policy", value: "privacy policy" },
      ]);
      return;
    }

    if (intent === "terms") {
      pushBot("Our terms of service cover purchases and use of this website.", [{ label: "Terms", value: "terms policy" }]);
      return;
    }

    if (intent === "contact") {
      pushBot(
        `Contact us:\nPhone: ${contactPhone}\nEmail: ${contactEmail}\nPlease include your order number when writing about an order.`,
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
          "We could not match that to your recent orders. Check the order number or open your order list.",
          [{ label: "My orders", value: "action:recent_orders" }],
        );
        return;
      } catch {
        pushBot("We could not load your orders. Please try again shortly.", [
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
      "How can we help? You can ask about orders, delivery, returns, payments, or use the shortcuts below.",
      INITIAL_ACTIONS,
    );
  };

  const handleAction = async (value: string) => {
    if (value === "action:recent_orders") {
      pushUser("Show my orders");
      await presentOrderList({ intro: "Here are your recent orders." });
      return;
    }
    if (value === "action:cancel_help") {
      pushUser("I want to cancel an order");
      await presentOrderList({
        intro: "Select an order to review. You may cancel from the details if the status is pending or confirmed.",
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
      pushBot("Understood. Your order is unchanged. How else can we help?", INITIAL_ACTIONS, undefined, 250);
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
