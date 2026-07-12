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
import { MAX_MESSAGES, RECENT_ORDER_LIMIT } from "./constants";
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
  isHinglishQuery,
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
import type { ChatMessage, Intent, OrderSummary, QuickAction } from "./types";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";

const SUPPORT_PHONE = "8340311033";
const SUPPORT_EMAIL = "support@thehouseofrani.com";
const GREETING = "Hi! How can I help you today?";

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

function isComplexMessage(text: string): boolean {
  const t = text.trim();
  if (t.length > 48) return true;
  if (/\b\d{6}\b/.test(t)) return true;
  return /\b(address|pata|ghar|gali|road|mumbai|delhi|bangalore|hyderabad|kolkata|chennai|pincode|pin code|area|city|state)\b/i.test(
    t,
  );
}

function shouldTryAiFirst(intent: Intent, text: string): boolean {
  if (TRANSACTIONAL_INTENTS.has(intent)) return false;
  if (intent === "general") return true;
  return isComplexMessage(text);
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
        return [botMessage(GREETING, MENU_ACTIONS)];
      });
    }, 320);
  }, [open, messages.length]);

  const pushBot = (
    text: string,
    actions?: QuickAction[],
    orders?: OrderSummary[],
    delay = 420,
  ) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) =>
        [...prev, botMessage(text, actions, orders)].slice(-MAX_MESSAGES),
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
    if (!shouldTryAiFirst(localIntent, rawInput)) return false;

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

      const actions: QuickAction[] =
        ai.suggestedActions?.length ?
          ai.suggestedActions
        : MENU_ACTIONS.slice(0, 4);
      pushBot(ai.answer, actions, undefined, 220);
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
          "You have no orders yet. After you place an order, it will appear here for tracking.",
          [
            { label: "Continue shopping", value: "open shop" },
            { label: "Delivery information", value: "shipping time" },
          ],
        );
        return;
      }

      const summaries = list.map(summarizeOrder);
      const cancelNote =
        opts.cancelHint ?
          "\n\nCancellations are available only while your order is pending or confirmed (before dispatch). For shipped orders, please contact us about returns."
        : "";
      const returnNote =
        opts.returnHint ?
          "\n\n**Returns:** delivered orders only, within **7 days** of delivery, and no return already in progress. Tap an order to open details, or use **Start a return** when you see it."
        : "";

      pushBot(
        `${opts.intro}\nUp to ${RECENT_ORDER_LIMIT} recent orders are shown below.${cancelNote}${returnNote}`,
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

  const smartOrderAssist = async (rawInput: string, intent: Intent) => {
    if (!isAuthenticated) {
      pushBot(
        "Apne orders dekhne ke liye pehle **sign in** karo.",
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
          .map(summarizeOrder);
        pushBot(
          result.intro,
          [{ label: "Saare orders", value: "action:recent_orders" }],
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
        intro: "Yeh rahe aapke recent orders.",
        cancelHint: intent === "cancel_help",
        returnHint: intent === "returns",
      });
    } catch {
      pushBot("Orders load nahi ho paye. Thodi der baad try karo.", [
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

      const hi = leadIn ? isHinglishQuery(leadIn) : true;
      const followUp =
        hi ?
          "\n\nKuch aur poochhna ho to bataiye 🙂"
        : "\n\nAnything else I can help with?";
      const detail = leadIn ?
        `${leadIn}\n\n${formatOrderFacts(order)}${followUp}`
      : `${formatOrderDetailText(order)}${followUp}`;
      const actions: QuickAction[] = [
        { label: "View on website", value: `open_order:${order._id}` },
        { label: "All orders", value: "action:recent_orders" },
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
          "This order can’t be returned from chat right now. It must be **delivered**, within **7 days** of delivery, with no return already in progress.",
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
      pushBot(GREETING, MENU_ACTIONS, undefined, 200);
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
          pushBot("Orders load nahi ho paye. Phir se try karo.", [
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
          "Samajh nahi aaya — neeche se order **chuno**, ya **1** / **2** likh kar bhejo.",
          [{ label: "Saare orders", value: "action:recent_orders" }],
          undefined,
          180,
        );
        return true;
      }
      setPending(null);
    }

    if (isAnythingElse(trimmed)) {
      setPending(null);
      pushBot("What do you need help with?", MENU_ACTIONS, undefined, 160);
      return true;
    }

    if (isGoodbye(trimmed)) {
      setPending(null);
      pushBot("Take care.", [{ label: "My orders", value: "action:recent_orders" }], undefined, 160);
      return true;
    }

    if (isThanks(trimmed)) {
      setPending(null);
      pushBot("You're welcome.", FOLLOW_UP_ACTIONS, undefined, 160);
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
        pushBot("Okay — your order is unchanged.", FOLLOW_UP_ACTIONS, undefined, 200);
      }
      return true;
    }

    if (aff === "yes") {
      pushBot("Choose what you need below.", MENU_ACTIONS, undefined, 160);
      return true;
    }

    pushBot("Okay.", FOLLOW_UP_ACTIONS, undefined, 160);
    return true;
  };

  const respondWithIntent = async (rawInput: string) => {
    const trimmed = rawInput.trim();

    if (await handleShortReply(trimmed)) return;

    if (isGreeting(trimmed)) {
      setPending(null);
      pushBot(GREETING, MENU_ACTIONS, undefined, 160);
      return;
    }

    if (isAbuse(trimmed)) {
      setPending(null);
      const hiAbuse = isHinglishQuery(trimmed);
      pushBot(
        hiAbuse ?
          "Main aapki madad ke liye yahan hoon. Order, delivery, return ya payment — jo bhi help chahiye, batayiye 🙂"
        : "I'm here to help you. Tell me what you need — orders, delivery, returns, or payments.",
        MENU_ACTIONS,
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

    const hi = isHinglishQuery(rawInput);

    if (intent === "shipping") {
      pushBot(
        hi ?
          "Orders aksar **1–3 business days** mein process hote hain. India mein delivery aam taur par **3–10 business days** leti hai. COD location ke hisaab se vary kar sakta hai."
        : "Orders are usually processed within 1–3 business days. Delivery within India typically takes 3–10 business days. Cash on delivery may vary by location.",
        [
          { label: "Shipping policy", value: "shipping policy" },
          { label: "My orders", value: "action:recent_orders" },
        ],
      );
      return;
    }

    if (intent === "payment") {
      pushBot(
        hi ?
          "Agar payment fail hua par paisa debit ho gaya, to aksar **3–7 business days** mein wapas aa jata hai. Na aaye to transaction reference ke saath humein contact karo."
        : "If a payment failed but an amount was debited, it usually reverses within 3–7 business days. If it does not, contact us with your transaction reference.",
        [{ label: "Contact support", value: "contact support" }],
      );
      return;
    }

    if (intent === "coupon") {
      pushBot(
        hi ?
          "Coupon ke liye minimum order value, valid dates, ya sirf first-time purchase ki shart ho sakti hai. Code checkout par apply karo, ya na chale to contact karo."
        : "Promotional codes may require a minimum order value, valid dates, or apply only to first-time purchases. Apply your code at checkout, or contact us if it is not accepted.",
        [{ label: "View cart", value: "open cart" }],
      );
      return;
    }

    if (intent === "sizing") {
      pushBot(
        hi ?
          "Apne measurements ko product page ke **size chart** se compare karo. Do sizes ke beech ho to bada size aksar zyada comfortable rehta hai."
        : "Please compare your measurements with the size chart on the product page. If you are between sizes, the larger size is often more comfortable.",
        [{ label: "Shop", value: "open shop" }],
      );
      return;
    }

    if (intent === "privacy") {
      pushBot(
        hi ?
          "Hum aapki information kaise use karte hain, ye privacy policy mein diya hai."
        : "How we use your information is described in our privacy policy.",
        [{ label: "Privacy policy", value: "privacy policy" }],
      );
      return;
    }

    if (intent === "terms") {
      pushBot(
        hi ?
          "Humari terms of service purchases aur website use ko cover karti hain."
        : "Our terms of service cover purchases and use of this website.",
        [{ label: "Terms", value: "terms policy" }],
      );
      return;
    }

    if (intent === "contact") {
      pushBot(
        hi ?
          `Humse contact karo:\nPhone: ${contactPhone}\nEmail: ${contactEmail}\nOrder ke baare mein likhte waqt apna order number zaroor dein.`
        : `Contact us:\nPhone: ${contactPhone}\nEmail: ${contactEmail}\nPlease include your order number when writing about an order.`,
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
      actions.push(...MENU_ACTIONS.slice(0, 3));
      pushBot(
        `Did you mean **${hint}**? Tap below, or send your order number.`,
        actions,
      );
      return;
    }

    pushBot("Choose an option below or send your order number.", MENU_ACTIONS);
  };

  const handleAction = async (value: string) => {
    if (value === "action:menu") {
      setPending(null);
      pushUser("Menu");
      pushBot("What do you need help with?", MENU_ACTIONS, undefined, 160);
      return;
    }
    if (value === "action:recent_orders") {
      pushUser("Show my orders");
      await presentOrderList({ intro: "Here are your recent orders." });
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
        order ? formatOrderAnswer(order, askedQuery ?? "order details", true)
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
        const label = INTENT_USER_LABEL[detectIntent(value)];
        pushUser(label ?? value);
      }
      await respondWithIntent(value);
    }
  };

  const submitUserText = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || typing || loadingOrders) return false;
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
