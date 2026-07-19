"use client";

import { useEffect, useRef, useState } from "react";
import { orderApi, raniCareApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Order } from "@/types";
import {
  getReturnReasonByIndex,
  isOrderReturnEligible,
  RETURN_REASON_OPTIONS,
} from "@/lib/orderReturnHelpers";
import {
  clearChatStorage,
  loadOpenState,
  loadStoredMessages,
  persistMessages,
  saveOpenState,
} from "./chatStorage";
import { MAX_MESSAGES, OPEN_EVENT, ORDER_LIST_DISPLAY_LIMIT, RECENT_ORDER_LIMIT } from "./constants";
import {
  FOLLOW_UP_ACTIONS,
  inferPendingFromActions,
  isAbuse,
  isAnythingElse,
  isGoodbye,
  isGreeting,
  isThanks,
  matchAffirmation,
  MENU_ACTIONS,
  type PendingPrompt,
} from "./conversationFlow";
import {
  detectIntent,
  findOrderIdByNumber,
  getIntentSuggestions,
  INTENT_USER_LABEL,
} from "./intent";
import {
  formatOrderAnswer,
  resolveOrdersFromQuery,
  resolvePickReply,
} from "./orderResolver";
import {
  botMessage,
  formatOrderDetailText,
  formatOrderFacts,
  summarizeOrder,
  userMessage,
} from "./orderFormat";
import { normalizeForIntent } from "./textNormalize";
import type {
  ChatMessage,
  Intent,
  OrderSummary,
  ProductCard,
  QuickAction,
} from "./types";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";

const SUPPORT_PHONE = "8340311033";
const SUPPORT_EMAIL = "support@thehouseofrani.com";
const GREETING =
  "Namaste! I'm **Rani Care**, your personal assistant at The House of Rani.\nI can help you track orders, manage cancellations or returns, answer delivery questions, or find the perfect saree — just ask 🙂";
const GREETING_ACTIONS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "Track order", value: "where is my order" },
  { label: "Find a saree", value: "saree recommend karo" },
  { label: "Returns", value: "action:return_help" },
  { label: "Contact us", value: "contact support" },
];

const AFTER_HELP_ACTIONS: QuickAction[] = [
  { label: "More help", value: "action:menu" },
  { label: "My orders", value: "action:recent_orders" },
  { label: "That's all", value: "no thanks" },
];

function appendNeedMoreHelp(text: string): string {
  const trimmed = text.trimEnd();
  // Never stack a second question — the answer may already end with one.
  if (/[?？]\s*$/.test(trimmed)) return text;
  if (/\bkuch aur|anything else|aur madad|need more help\b/i.test(text)) return text;
  return `${trimmed}\n\nAnything else I can help with?`;
}

/** Friendly user-bubble labels for chips whose value is machine-ish text. */
const ACTION_TEXT_LABEL: Record<string, string> = {
  "where is my order": "Track my order",
  "saree recommend karo": "Find a saree",
  "saree under 2000": "Saree under ₹2000",
  "shipping time": "Delivery info",
  "contact support": "Contact support",
  "no thanks": "That's all",
  "aapke paas kya kya milega": "Available categories",
  "open shop": "Open shop",
};

function looksLikePickAttempt(text: string): boolean {
  const q = normalizeForIntent(text);
  if (/^\d+$/.test(q)) return true;
  if (/\b(pehla|dusra|teesra|first|second|third)\b/.test(q)) return true;
  if (/\b[A-Z]{2,}[\w#-]*\d{2,}\b/i.test(text)) return true;
  return q.length <= 14;
}

const TRANSACTIONAL_INTENTS = new Set<Intent>([
  "show_orders",
  "cancel_help",
  "returns",
]);

/** Route everything except secure order actions through the RAG assistant so
 *  it can answer naturally (FAQ, products, sizing, delivery, general chat). */
function shouldTryAiFirst(intent: Intent): boolean {
  return !TRANSACTIONAL_INTENTS.has(intent);
}

export function useRaniCareChat() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [contactPhone] = useState(SUPPORT_PHONE);
  const [contactEmail] = useState(SUPPORT_EMAIL);
  const recentOrdersRef = useRef<Order[]>([]);
  const greetedRef = useRef(false);
  const pendingPromptRef = useRef<PendingPrompt | null>(null);
  const wasAuthRef = useRef(isAuthenticated);

  const setPending = (p: PendingPrompt | null) => {
    pendingPromptRef.current = p;
  };

  const resolvePending = (): PendingPrompt | null => {
    if (pendingPromptRef.current) return pendingPromptRef.current;
    const lastBot = [...messages].reverse().find((m) => m.sender === "bot");
    return inferPendingFromActions(lastBot?.actions);
  };

  useEffect(() => {
    setOpen(loadOpenState());
    const { messages: stored } = loadStoredMessages();
    setMessages(stored);
    const lastBot = [...stored].reverse().find((m) => m.sender === "bot");
    pendingPromptRef.current = inferPendingFromActions(lastBot?.actions);
  }, []);

  useEffect(() => {
    const onOpenRequest = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_EVENT, onOpenRequest);
  }, []);

  useEffect(() => {
    if (messages.length) persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveOpenState(open);
  }, [open]);

  useEffect(() => {
    if (wasAuthRef.current && !isAuthenticated) {
      clearChatStorage();
      setMessages([]);
      greetedRef.current = false;
      setPending(null);
    }
    wasAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open || greetedRef.current || messages.length > 0) return;
    greetedRef.current = true;
    window.setTimeout(() => {
      setMessages((prev) => {
        if (prev.length) return prev;
        return [botMessage(GREETING, GREETING_ACTIONS)];
      });
    }, 320);
  }, [open, messages.length]);

  /** Chat must always start with the bot's namaste — even when the user's
   *  first move is a starter chip click before the delayed greeting lands. */
  const ensureGreeted = () => {
    greetedRef.current = true;
    setMessages((prev) => {
      if (prev.length) return prev;
      return [botMessage(GREETING)];
    });
  };

  const pushBot = (
    text: string,
    actions?: QuickAction[],
    orders?: OrderSummary[],
    delay = 420,
    products?: ProductCard[],
  ) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) =>
        [...prev, botMessage(text, actions, orders, products)].slice(-MAX_MESSAGES),
      );
    }, delay);
  };

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, userMessage(text)].slice(-MAX_MESSAGES));
  };

  const recentChatForAi = (currentUserText?: string) => {
    const base = messages
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("bot" as const),
        text: m.text.slice(0, 400),
      }));
    if (!currentUserText?.trim()) return base;
    return [
      ...base,
      { role: "user" as const, text: currentUserText.trim().slice(0, 400) },
    ].slice(-6);
  };

  const tryAiAssist = async (
    rawInput: string,
    localIntent: Intent,
  ): Promise<boolean> => {
    if (!shouldTryAiFirst(localIntent)) return false;

    setTyping(true);
    try {
      const res = await raniCareApi.chat({
        message: rawInput,
        isAuthenticated,
        localIntent,
        recentMessages: recentChatForAi(rawInput),
      });
      const ai = res.data;
      const route = ai.routeIntent;

      if (route === "show_orders") {
        setTyping(false);
        await smartOrderAssist(rawInput, "show_orders");
        return true;
      }
      if (route === "cancel_help") {
        setTyping(false);
        await smartOrderAssist(rawInput, "cancel_help");
        return true;
      }
      if (route === "returns") {
        setTyping(false);
        await smartOrderAssist(rawInput, "returns");
        return true;
      }
      if (route === "contact") {
        setTyping(false);
        pushBot(
          ai.answer ||
            `Contact us:\nPhone: ${contactPhone}\nEmail: ${contactEmail}\nPlease include your order number when writing about an order.`,
          ai.suggestedActions?.length ?
            ai.suggestedActions
          : [
              { label: "Call", value: "call support" },
              { label: "Email", value: "email support" },
            ],
          undefined,
          180,
        );
        return true;
      }

      const products = ai.products as ProductCard[] | undefined;
      const actions: QuickAction[] =
        ai.suggestedActions?.length ?
          ai.suggestedActions
        : products?.length ?
          [
            { label: "Shop all", value: "open shop" },
            { label: "More options", value: "action:menu" },
            { label: "That's all", value: "no thanks" },
          ]
        : AFTER_HELP_ACTIONS;
      const answer = appendNeedMoreHelp(ai.answer);
      pushBot(answer, actions, undefined, 220, products);
      return true;
    } catch {
      setTyping(false);
      return false;
    }
  };

  const fetchRecentOrders = async (): Promise<Order[]> => {
    const body = await orderApi.getMyOrders({
      page: 1,
      limit: RECENT_ORDER_LIMIT,
    });
    const list = (body.data?.orders || []) as Order[];
    recentOrdersRef.current = list;
    return list;
  };

  const presentOrderList = async (opts: {
    intro: string;
    cancelHint?: boolean;
    returnHint?: boolean;
  }) => {
    if (!isAuthenticated) {
      pushBot(
        "Please sign in to view your orders and request a cancellation.",
        [
          { label: "Sign in", value: "sign in" },
          { label: "Shipping information", value: "shipping policy" },
        ],
      );
      return;
    }

    setLoadingOrders(true);
    try {
      const list = await fetchRecentOrders();
      if (!list.length) {
        pushBot(
          "You don't have any orders yet. Once you place one, you can track it right here 🙂",
          [
            { label: "Shop sarees", value: "open shop" },
            { label: "Delivery info", value: "shipping time" },
          ],
        );
        return;
      }

      const shown = list.slice(0, ORDER_LIST_DISPLAY_LIMIT);
      const summaries = shown.map(summarizeOrder);
      const more =
        list.length > shown.length ?
          `\n(Showing the **${shown.length}** most recent of **${list.length}** — send an order number or say “last 2 orders”.)`
        : "";
      const cancelNote =
        opts.cancelHint ?
          "\n\nCancellation is available only for **pending / confirmed** orders (before dispatch)."
        : "";
      const returnNote =
        opts.returnHint ?
          "\n\n**Returns:** delivered orders, within **5 days**, with tags intact."
        : "";

      pushBot(
        `${opts.intro}${more}${cancelNote}${returnNote}\n\nWhich one would you like to open?`,
        [
          { label: "Refresh", value: "action:recent_orders" },
          { label: "Contact support", value: "contact support" },
          { label: "That's all", value: "no thanks" },
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

  const smartOrderAssist = async (rawInput: string, intent: Intent) => {
    if (!isAuthenticated) {
      pushBot(
        "Please **sign in** first to view your orders.",
        [
          { label: "Sign in", value: "sign in" },
          { label: "Delivery info", value: "shipping time" },
        ],
      );
      return;
    }

    setLoadingOrders(true);
    try {
      const list = await fetchRecentOrders();
      const result = resolveOrdersFromQuery(list, rawInput, intent);

      if (result.kind === "single") {
        await presentOrderDetail(result.orderId, result.intro);
        return;
      }

      if (result.kind === "pick") {
        setPending({
          type: "pick_order",
          orderIds: result.orderIds,
          purpose: result.purpose,
          query: rawInput,
        });
        const summaries = list
          .filter((o) => result.orderIds.includes(o._id))
          .slice(0, ORDER_LIST_DISPLAY_LIMIT)
          .map(summarizeOrder);
        pushBot(
          result.intro,
          [
            { label: "Recent orders", value: "action:recent_orders" },
            { label: "That's all", value: "no thanks" },
          ],
          summaries,
        );
        return;
      }

      if (result.kind === "none") {
        pushBot(result.intro, [
          { label: "My orders", value: "action:recent_orders" },
          { label: "Contact", value: "contact support" },
        ]);
        return;
      }

      await presentOrderList({
        intro: "Here are your **recent** orders:",
        cancelHint: intent === "cancel_help",
        returnHint: intent === "returns",
      });
    } catch {
      pushBot("We couldn't load your orders. Please try again in a moment.", [
        { label: "Try again", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const presentOrderDetail = async (orderId: string, leadIn?: string) => {
    if (!isAuthenticated) {
      pushBot("Please sign in to view order details.", [
        { label: "Sign in", value: "sign in" },
      ]);
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
          recentOrdersRef.current = [order, ...rest].slice(
            0,
            RECENT_ORDER_LIMIT,
          );
        }
      }
      if (!order) {
        pushBot(
          "That order was not found on your account. Refresh your order list and try again.",
        );
        return;
      }

      const detail = leadIn ?
        appendNeedMoreHelp(`${leadIn}\n\n${formatOrderFacts(order)}`)
      : appendNeedMoreHelp(formatOrderDetailText(order));
      const actions: QuickAction[] = [
        { label: "View on website", value: `open_order:${order._id}` },
        { label: "Recent orders", value: "action:recent_orders" },
      ];
      if (order.status === "pending" || order.status === "confirmed") {
        actions.unshift({
          label: "Cancel this order",
          value: `cancel_ask:${order._id}`,
        });
      } else if (isOrderReturnEligible(order)) {
        actions.unshift({
          label: "Start a return",
          value: `return_start:${order._id}`,
        });
      } else {
        actions.unshift({
          label: "Return & refund help",
          value: "action:return_help",
        });
      }
      actions.push(...AFTER_HELP_ACTIONS.filter((a) => !actions.some((x) => x.value === a.value)));

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
      pushBot("Open your order list again, then try to cancel.", [
        { label: "Recent orders", value: "action:recent_orders" },
      ]);
      return;
    }
    if (o.status !== "pending" && o.status !== "confirmed") {
      pushBot(
        `Order ${o.orderNumber} is already ${o.status}. It cannot be cancelled here. Please contact us for returns or refunds.`,
        [{ label: "Contact support", value: "contact support" }],
      );
      return;
    }

    setPending({ type: "cancel_order", orderId: o._id });
    pushBot(
      `Cancel order **${o.orderNumber}**?\nOnly before dispatch. Reply **yes** to confirm or **no** to keep the order.`,
      [
        { label: "Yes, cancel", value: `cancel_confirm:${o._id}` },
        { label: "No, keep order", value: "cancel_abort" },
      ],
      undefined,
      200,
    );
  };

  const presentReturnReasonPick = async (orderId: string) => {
    setLoadingOrders(true);
    try {
      const ob = await orderApi.getById(orderId);
      const full = ob.data?.order as Order | undefined;
      if (!full || !isOrderReturnEligible(full)) {
        pushBot(
          "This order can’t be returned from chat right now. It must be **delivered**, within **5 days** of delivery, with no return already in progress.",
          [
            { label: "My orders", value: "action:recent_orders" },
            { label: "Contact support", value: "contact support" },
          ],
        );
        return;
      }
      const actions: QuickAction[] = RETURN_REASON_OPTIONS.map(
        (label, idx) => ({
          label: label.length > 28 ? `${label.slice(0, 26)}…` : label,
          value: `return_reason:${orderId}:${idx}`,
        }),
      );
      actions.push({ label: "Never mind", value: "return_abort" });
      pushBot(
        `**Step 1 of 2** — Order **${full.orderNumber}**\nWhy are you returning?`,
        actions,
        undefined,
        240,
      );
    } catch {
      pushBot("We couldn’t open that return. Try again from your order list.", [
        { label: "My orders", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const submitReturnReasonFromChat = async (
    orderId: string,
    reasonIdx: number,
  ) => {
    const reason = getReturnReasonByIndex(reasonIdx);
    if (!reason) return;
    setLoadingOrders(true);
    try {
      const ob = await orderApi.getById(orderId);
      const full = ob.data?.order as Order | undefined;
      if (!full || !isOrderReturnEligible(full)) {
        pushBot("This order is no longer eligible for a return.", [
          { label: "My orders", value: "action:recent_orders" },
        ]);
        return;
      }
      if (full.paymentMethod === "razorpay") {
        await orderApi.requestReturn(
          full._id,
          reason,
          "",
          undefined,
          undefined,
        );
        await fetchRecentOrders();
        pushBot(
          `Return submitted for **${full.orderNumber}**. Refund will go to your **original payment method** (usually 5–7 business days).`,
          FOLLOW_UP_ACTIONS,
          undefined,
          320,
        );
        return;
      }
      pushBot(
        `**Step 2 of 2** — Reason: **${reason}**\nFor **COD** refunds, add your **UPI or bank details** securely on the order page (same two-step flow as the website).`,
        [
          {
            label: "Enter refund details",
            value: `open_order_return:${orderId}:${reasonIdx}`,
          },
          { label: "My orders", value: "action:recent_orders" },
        ],
        undefined,
        280,
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err ?
          String((err as { message: string }).message)
        : "Could not submit return.";
      pushBot(msg, [
        { label: "Try again", value: `return_start:${orderId}` },
        { label: "My orders", value: "action:recent_orders" },
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const executeCancel = async (orderId: string) => {
    setLoadingOrders(true);
    try {
      await orderApi.cancel(orderId, "Cancelled via customer support chat");
      await fetchRecentOrders();
      setPending(null);
      pushBot(
        "Your order has been cancelled. Online refunds usually take a few business days via your bank or card.",
        FOLLOW_UP_ACTIONS,
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err ?
          String((err as { message: string }).message)
        : "Cancellation failed.";
      pushBot(
        `${msg} If your order has shipped, contact us for the next steps.`,
        [
          { label: "Recent orders", value: "action:recent_orders" },
          { label: "Contact support", value: "contact support" },
        ],
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const clearChat = (withWelcome = true) => {
    clearChatStorage();
    setMessages([]);
    setShowClearConfirm(false);
    greetedRef.current = false;
    setPending(null);
    if (withWelcome) {
      greetedRef.current = true;
      pushBot(GREETING, GREETING_ACTIONS, undefined, 200);
    }
  };

  const handleShortReply = async (rawInput: string): Promise<boolean> => {
    const trimmed = rawInput.trim();

    const pendingPick = resolvePending();
    if (pendingPick?.type === "pick_order") {
      if (!recentOrdersRef.current.length) {
        try {
          await fetchRecentOrders();
        } catch {
          pushBot("We couldn't load your orders. Please try again.", [
            { label: "My orders", value: "action:recent_orders" },
          ]);
          return true;
        }
      }
      const picked = resolvePickReply(
        trimmed,
        pendingPick.orderIds,
        recentOrdersRef.current,
      );
      if (picked) {
        setPending(null);
        const order = recentOrdersRef.current.find((o) => o._id === picked);
        const askedQuery = pendingPick.query || trimmed;
        const intro = order ? formatOrderAnswer(order, askedQuery) : undefined;
        await presentOrderDetail(picked, intro);
        return true;
      }
      if (looksLikePickAttempt(trimmed)) {
        pushBot(
          "I didn't catch that — **pick an order** below, or reply with **1** / **2**.",
          [{ label: "All orders", value: "action:recent_orders" }],
          undefined,
          180,
        );
        return true;
      }
      setPending(null);
    }

    if (isAnythingElse(trimmed)) {
      setPending(null);
      pushBot("Of course — what do you need help with?", GREETING_ACTIONS, undefined, 160);
      return true;
    }

    if (isGoodbye(trimmed)) {
      setPending(null);
      pushBot(
        "Take care — come back anytime. Happy shopping!",
        [{ label: "My orders", value: "action:recent_orders" }],
        undefined,
        160,
      );
      return true;
    }

    if (isThanks(trimmed)) {
      setPending(null);
      pushBot(
        "You're welcome! Need anything else?",
        AFTER_HELP_ACTIONS,
        undefined,
        160,
      );
      return true;
    }

    const aff = matchAffirmation(trimmed);
    if (!aff) return false;

    const pending = resolvePending();
    if (pending?.type === "cancel_order") {
      setPending(null);
      if (aff === "yes") {
        pushUser("Yes");
        await executeCancel(pending.orderId);
      } else {
        pushUser("No");
        pushBot(
          "Okay — your order stays as it is. Anything else?",
          AFTER_HELP_ACTIONS,
          undefined,
          200,
        );
      }
      return true;
    }

    if (aff === "yes") {
      pushBot("What do you need help with?", GREETING_ACTIONS, undefined, 160);
      return true;
    }

    pushBot(
      "Alright! I'm here whenever you need help 🙂",
      AFTER_HELP_ACTIONS,
      undefined,
      160,
    );
    return true;
  };

  const respondWithIntent = async (rawInput: string) => {
    const trimmed = rawInput.trim();

    if (await handleShortReply(trimmed)) return;

    if (isGreeting(trimmed)) {
      setPending(null);
      pushBot(GREETING, GREETING_ACTIONS, undefined, 160);
      return;
    }

    if (isAbuse(trimmed)) {
      setPending(null);
      pushBot(
        "I'm here to help. Tell me what you need — orders, delivery, returns, or shopping.",
        GREETING_ACTIONS,
        undefined,
        160,
      );
      return;
    }

    const intent = detectIntent(rawInput);

    if (await tryAiAssist(trimmed, intent)) return;

    if (intent === "show_orders" || intent === "cancel_help") {
      await smartOrderAssist(rawInput, intent);
      return;
    }

    if (intent === "returns") {
      await smartOrderAssist(rawInput, intent);
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
      pushBot(
        "How we use your information is described in our privacy policy.",
        [{ label: "Privacy policy", value: "privacy policy" }],
      );
      return;
    }

    if (intent === "terms") {
      pushBot(
        "Our terms of service cover purchases and use of this website.",
        [{ label: "Terms", value: "terms policy" }],
      );
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

    if (
      isAuthenticated &&
      /\b[A-Z]{2,}[\w#-]*\d{2,}\b/i.test(rawInput.trim())
    ) {
      setLoadingOrders(true);
      try {
        if (!recentOrdersRef.current.length) await fetchRecentOrders();
        const id = findOrderIdByNumber(rawInput, recentOrdersRef.current);
        if (id) {
          const order = recentOrdersRef.current.find((o) => o._id === id);
          const intro = order ? formatOrderAnswer(order, rawInput) : undefined;
          await presentOrderDetail(id, intro);
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
        const order = recentOrdersRef.current.find((o) => o._id === id);
        const intro = order ? formatOrderAnswer(order, rawInput) : undefined;
        await presentOrderDetail(id, intro);
        return;
      }
    }

    const suggestions = getIntentSuggestions(rawInput, 2);
    if (suggestions.length) {
      const hint = suggestions.map((s) => s.label).join(" or ");
      const actions: QuickAction[] = suggestions.map((s) => ({
        label: s.label.charAt(0).toUpperCase() + s.label.slice(1),
        value: s.actionValue,
      }));
      actions.push(...GREETING_ACTIONS.slice(0, 3));
      pushBot(
        `Did you mean **${hint}**? Pick an option below, or send an order number — I'll figure it out 🙂`,
        actions,
      );
      return;
    }

    pushBot(
      "I didn't quite get that — no worries. Pick an option below, or type it in your own words (typos are fine).",
      GREETING_ACTIONS,
    );
  };

  const handleAction = async (value: string) => {
    ensureGreeted();
    if (value === "action:menu") {
      setPending(null);
      pushUser("Menu");
      pushBot("What do you need help with?", GREETING_ACTIONS, undefined, 160);
      return;
    }
    if (value === "action:recent_orders") {
      pushUser("Show my orders");
      await presentOrderList({
        intro: "Here are your **recent** orders:",
      });
      return;
    }
    if (value === "action:cancel_help") {
      pushUser("I want to cancel an order");
      await smartOrderAssist("cancel my order", "cancel_help");
      return;
    }
    if (value === "return refund") {
      await handleAction("action:return_help");
      return;
    }
    if (value === "action:return_help") {
      pushUser("I need returns or refund help");
      await smartOrderAssist("return refund", "returns");
      return;
    }
    if (value.startsWith("return_start:")) {
      const orderId = value.slice("return_start:".length);
      pushUser("Start a return");
      await presentReturnReasonPick(orderId);
      return;
    }
    if (value.startsWith("return_reason:")) {
      const rest = value.slice("return_reason:".length);
      const lastColon = rest.lastIndexOf(":");
      if (lastColon <= 0) return;
      const orderId = rest.slice(0, lastColon);
      const idx = parseInt(rest.slice(lastColon + 1), 10);
      if (Number.isNaN(idx)) return;
      const label = getReturnReasonByIndex(idx) ?? "Reason";
      pushUser(label);
      await submitReturnReasonFromChat(orderId, idx);
      return;
    }
    if (value === "return_abort") {
      pushUser("No");
      setPending(null);
      pushBot("Return cancelled. Your order is unchanged.", FOLLOW_UP_ACTIONS, undefined, 200);
      return;
    }
    if (value.startsWith("open_order_return:")) {
      const rest = value.slice("open_order_return:".length);
      const lastColon = rest.lastIndexOf(":");
      if (lastColon <= 0) return;
      const oid = rest.slice(0, lastColon);
      const idx = rest.slice(lastColon + 1);
      window.location.href = `/dashboard/orders/${encodeURIComponent(oid)}?return=${encodeURIComponent(idx)}`;
      return;
    }
    if (value.startsWith("order_pick:")) {
      const id = value.slice("order_pick:".length);
      const pending = resolvePending();
      const askedQuery =
        pending?.type === "pick_order" ? pending.query : undefined;
      setPending(null);
      pushUser("Open order details");
      const order = recentOrdersRef.current.find((o) => o._id === id);
      const intro =
        order ? formatOrderAnswer(order, askedQuery ?? "order details")
        : undefined;
      await presentOrderDetail(id, intro);
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
      pushUser("No");
      setPending(null);
      pushBot("Your order is unchanged.", FOLLOW_UP_ACTIONS, undefined, 200);
      return;
    }
    if (value.startsWith("open_order:")) {
      window.location.href = `/dashboard/orders/${encodeURIComponent(value.slice("open_order:".length))}`;
      return;
    }

    if (value === "open orders") window.location.href = "/dashboard/orders";
    else if (value === "open cart") window.location.href = "/cart";
    else if (value === "open shop") window.location.href = "/shop";
    else if (value === "shipping policy") window.location.href = "/shipping";
    else if (value === "privacy policy") window.location.href = "/privacy";
    else if (value === "terms policy") window.location.href = "/terms";
    else if (value === "sign in") window.location.href = loginUrlWithRedirect("/");
    else if (value === "call support")
      window.location.href = `tel:${contactPhone.replace(/\s+/g, "")}`;
    else if (value === "email support")
      window.location.href = `mailto:${contactEmail}?subject=Customer%20Support%20Request`;
    else {
      const isMachine =
        value.startsWith("action:") || /^[a-z]+:/.test(value);
      if (!isMachine) {
        const label =
          ACTION_TEXT_LABEL[value] ?? INTENT_USER_LABEL[detectIntent(value)];
        pushUser(label ?? value);
      }
      await respondWithIntent(value);
    }
  };

  const submitUserText = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || typing || loadingOrders) return false;
    ensureGreeted();
    setInput("");
    setMessages((prev) => [...prev, userMessage(trimmed)].slice(-MAX_MESSAGES));
    await respondWithIntent(trimmed);
    return true;
  };

  return {
    open,
    setOpen,
    typing,
    loadingOrders,
    input,
    setInput,
    messages,
    contactPhone,
    contactEmail,
    handleAction,
    submitUserText,
    showClearConfirm,
    setShowClearConfirm,
    clearChat,
  };
}
