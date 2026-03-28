"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  UserRound,
  Sparkles,
  Loader2,
  LayoutDashboard,
  BarChart3,
  ExternalLink,
  Shield,
  Lightbulb,
  Zap,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";

type ChatSender = "bot" | "user";
type QuickAction = { label: string; value: string };

type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: number;
  actions?: QuickAction[];
};

const STORAGE_KEY = "rani-admin-concierge-v2";
const OPEN_KEY = "rani-admin-concierge-open";
const MAX_MESSAGES = 48;

/** Primary shortcuts — always visible on fresh chat */
const INITIAL_ACTIONS: QuickAction[] = [
  { label: "Quick stats", value: "action:quick_stats" },
  { label: "What can you do?", value: "action:capabilities" },
  { label: "Order workflow tips", value: "action:help_workflow" },
  { label: "Orders", value: "nav:/admin/orders" },
  { label: "Products", value: "nav:/admin/products" },
  { label: "Analytics", value: "nav:/admin/analytics" },
  { label: "Storefront", value: "nav:/admin/storefront" },
  { label: "Emails", value: "nav:/admin/emails" },
  { label: "Coupons", value: "nav:/admin/coupons" },
  { label: "Users", value: "nav:/admin/users" },
  { label: "Reviews", value: "nav:/admin/reviews" },
];

const WELCOME_TEXT = [
  "**Rani Admin Copilot** — your in-panel helper (not a live human).",
  "",
  "**Abhi kya kar sakta hai**",
  "· **Navigation** — ek tap par Orders, Products, Analytics, Storefront, Emails, Coupons, Users, Reviews.",
  "· **Quick stats** — revenue, AOV, aaj ke orders, fulfilment queue, users & reviews (live API).",
  "· **Context** — jo page khula hai, uske hisaab se chhota hint.",
  "· **Keywords** — type karo: orders, tracking, stock, coupon, refund idea, email campaign…",
  "",
  "Neeche buttons se start karo, ya **What can you do?** dabao.",
].join("\n");

function botMessage(text: string, actions?: QuickAction[]): ChatMessage {
  return {
    id: `ab_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    sender: "bot",
    text,
    timestamp: Date.now(),
    actions,
  };
}

function userMessage(text: string): ChatMessage {
  return { id: `au_${Date.now()}_${Math.random().toString(36).slice(2)}`, sender: "user", text, timestamp: Date.now() };
}

function detectAdminIntent(q: string): string {
  const s = q.toLowerCase();
  if (/\b(what can|capabilities|features|kya kar|kya kar sak|help me|madad|guide)\b/.test(s)) return "capabilities";
  if (/\b(workflow|process|how to|kaise|fulfil|fulfill step)\b/.test(s)) return "workflow";
  if (/\b(advanced|aage|scaling|integration|api|webhook|roadmap|future|aur kya)\b/.test(s)) return "advanced";
  if (/\b(stats|overview|dashboard|how many|numbers)\b/.test(s)) return "stats";
  if (/\b(orders?|dispatch|ship|tracking|awb|delivery)\b/.test(s)) return "orders";
  if (/\b(refund|return|cancel|replacement)\b/.test(s)) return "after_sales";
  if (/\b(products?|stock|inventory|sku|low stock|out of stock)\b/.test(s)) return "products";
  if (/\b(coupon|discount|promo)\b/.test(s)) return "coupons";
  if (/\b(users?|customers?|ban|block)\b/.test(s)) return "users";
  if (/\b(reviews?|moderat|rating|reply)\b/.test(s)) return "reviews";
  if (/\b(analytics?|revenue|sales?|report|chart)\b/.test(s)) return "analytics";
  if (/\b(email|campaign|newsletter|broadcast)\b/.test(s)) return "emails";
  if (/\b(storefront|hero|banner|footer|announcement)\b/.test(s)) return "storefront";
  if (/\bcategor/.test(s)) return "categories";
  if (/\b(payment|razorpay|cod|upi)\b/.test(s)) return "payments";
  return "general";
}

const CAPABILITIES_REPLY = [
  "**Yeh Copilot abhi kya karta hai**",
  "",
  "1. **Ek click par admin pages** — Orders se lekar Reviews tak.",
  "2. **Quick business stats** — total / month revenue, AOV, aaj ke orders, kitne orders abhi pack/confirm pending hain, users & reviews count.",
  "3. **Smart hints** — jis admin screen par ho, uske mutabiq short tip.",
  "4. **Natural language (basic)** — jaise \"orders\", \"stock low\", \"coupon\", \"email campaign\" — relevant section suggest.",
  "",
  "**Yeh abhi NAHI hai** (future / advanced ideas niche)",
  "· Asli AI ya customer chat yahan handle nahi hota — woh storefront **RaniCare** par hai.",
  "· Direct database edit / bulk CSV yahan se nahi — Products & Orders UI use karo.",
].join("\n");

const WORKFLOW_REPLY = [
  "**Typical order flow (admin)**",
  "",
  "1. **Orders** — naye orders dekho; status **Confirmed → Processing** jab pack start ho.",
  "2. **Shipped** — carrier + tracking ID / URL bharo taaki customer track kar sake.",
  "3. **Delivered** — confirm karo; reviews ke liye customer ko time do.",
  "4. **Cancel / refund** — policy ke hisaab se; payment gateway refunds alag se settle hote hain.",
  "",
  "**Tip:** Analytics me **fulfilment queue** number se pata chalta hai kitne orders abhi active pipeline me hain.",
].join("\n");

const ADVANCED_REPLY = [
  "**Roadmap** — aur kitna advanced ban sakta hai? (implement alag phase)",
  "",
  "**Direction** · **Idea**",
  "",
  "**Data** — Real-time KPIs, filters (\"last 7 days\"), drill-down links with query params.",
  "",
  "**Actions** — Approve refund, change order status, create coupon — only with secure admin APIs + confirmations.",
  "",
  "Abhi ke liye **Quick stats** + **one-tap navigation** sabse practical combo hai.",
].join("\n");

const AFTER_SALES_REPLY = [
  "**Returns / refunds / cancellations**",
  "",
  "· Customer-side cancellations **sirf jab tak** order **Pending / Confirmed** ho (dispatch se pehle) — detail **Orders** me.",
  "· Shipped ke baad **Returns** policy + support — **Orders** & **Reviews** se track karo.",
  "· Payment reversal timelines **bank / Razorpay** par depend karte hain.",
  "",
  "Orders list khol kar specific order kholo:",
].join("\n");

export default function AdminConcierge() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const welcome = useMemo(() => botMessage(WELCOME_TEXT, INITIAL_ACTIONS), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const o = localStorage.getItem(OPEN_KEY);
      if (o === "1") setOpen(true);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-MAX_MESSAGES));
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setMessages([welcome]);
  }, [welcome]);

  useEffect(() => {
    if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, loadingStats]);

  const pushBot = (text: string, actions?: QuickAction[], delay = 350) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, botMessage(text, actions)].slice(-MAX_MESSAGES));
    }, delay);
  };

  const pathHint = useMemo(() => {
    if (!pathname) return "";
    if (pathname === "/admin" || pathname === "/admin/")
      return "You're on **Dashboard** — overview cards, revenue chart, low stock, recent orders.";
    if (pathname.startsWith("/admin/orders")) return "You're on **Orders** — status, tracking, carrier, notes.";
    if (pathname.startsWith("/admin/products")) return "You're on **Products** — SKU, stock, images, pricing.";
    if (pathname.startsWith("/admin/categories")) return "You're on **Categories** — merchandising structure.";
    if (pathname.startsWith("/admin/analytics")) return "You're on **Analytics** — views vs sales, category revenue.";
    if (pathname.startsWith("/admin/storefront")) return "You're on **Storefront** — hero, banners, footer, announcements.";
    if (pathname.startsWith("/admin/emails")) return "You're on **Email campaigns** — HTML preview & sends.";
    if (pathname.startsWith("/admin/coupons")) return "You're on **Coupons** — rules, limits, expiry.";
    if (pathname.startsWith("/admin/users")) return "You're on **Users** — accounts & status.";
    if (pathname.startsWith("/admin/reviews")) return "You're on **Reviews** — moderation & replies.";
    return "";
  }, [pathname]);

  const respond = (raw: string) => {
    if (raw === "action:capabilities") {
      pushBot(CAPABILITIES_REPLY, [
        { label: "Quick stats", value: "action:quick_stats" },
        { label: "Order workflow", value: "action:help_workflow" },
        { label: "Advanced ideas", value: "action:help_advanced" },
        { label: "Orders", value: "nav:/admin/orders" },
      ]);
      return;
    }
    if (raw === "action:help_workflow") {
      pushBot(WORKFLOW_REPLY, [
        { label: "Open orders", value: "nav:/admin/orders" },
        { label: "Analytics", value: "nav:/admin/analytics" },
      ]);
      return;
    }
    if (raw === "action:help_advanced") {
      pushBot(ADVANCED_REPLY, [
        { label: "Analytics", value: "nav:/admin/analytics" },
        { label: "Email campaigns", value: "nav:/admin/emails" },
      ]);
      return;
    }

    const intent = detectAdminIntent(raw);

    if (intent === "capabilities") {
      pushBot(CAPABILITIES_REPLY, [
        { label: "Workflow tips", value: "action:help_workflow" },
        { label: "Advanced ideas", value: "action:help_advanced" },
      ]);
      return;
    }
    if (intent === "workflow") {
      pushBot(WORKFLOW_REPLY, [{ label: "Orders", value: "nav:/admin/orders" }]);
      return;
    }
    if (intent === "advanced") {
      pushBot(ADVANCED_REPLY, INITIAL_ACTIONS.slice(0, 6));
      return;
    }

    if (intent === "stats" || raw === "action:quick_stats") {
      setLoadingStats(true);
      void (async () => {
        try {
          const body = await adminApi.getAnalytics();
          const d = body.data as { overview?: Record<string, unknown> } | undefined;
          const o = d?.overview;
          if (!o) {
            pushBot("Could not load stats. Check that the API is reachable.", [{ label: "Retry", value: "action:quick_stats" }]);
            return;
          }
          const n = (v: unknown) =>
            typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || 0;
          pushBot(
            [
              "**Quick snapshot**",
              `· Revenue (all time): ${formatPrice(n(o.totalRevenue))}`,
              `· This month: ${formatPrice(n(o.monthRevenue))} (${n(o.monthOrders)} orders)`,
              `· AOV: ${formatPrice(n(o.avgOrderValue))}`,
              `· Orders today: ${n(o.ordersToday)}`,
              `· Fulfilment queue: ${n(o.pendingFulfillmentCount)}`,
              `· Users: ${n(o.totalUsers)} (${n(o.newUsersThisMonth)} new this month)`,
              `· Reviews: ${n(o.totalReviews)} (${n(o.reviewsThisMonth)} this month)`,
              "",
              pathHint || "Open **Analytics** for charts and top products.",
            ].join("\n"),
            [
              { label: "Full analytics", value: "nav:/admin/analytics" },
              { label: "Orders", value: "nav:/admin/orders" },
            ],
            200
          );
        } catch {
          pushBot("Stats request failed. Try again or open Analytics from the sidebar.");
        } finally {
          setLoadingStats(false);
        }
      })();
      return;
    }

    if (intent === "after_sales") {
      pushBot(AFTER_SALES_REPLY, [
        { label: "Open orders", value: "nav:/admin/orders" },
        { label: "Reviews", value: "nav:/admin/reviews" },
      ]);
      return;
    }

    if (intent === "payments") {
      pushBot(
        "**Payments (Razorpay / COD)**\n\nOnline payments **Orders** detail me dikhte hain. COD orders ka collection delivery par hota hai. Failed payment disputes ke liye transaction ID save rakho.",
        [{ label: "Orders", value: "nav:/admin/orders" }]
      );
      return;
    }

    const goNav = (path: string, title: string) => {
      pushBot(
        `**${title}**\n\n${pathHint ? `${pathHint}\n\n` : ""}Neeche button se section kholo.`,
        [{ label: `Open ${title}`, value: `nav:${path}` }]
      );
    };

    switch (intent) {
      case "orders":
        goNav("/admin/orders", "Orders");
        return;
      case "products":
        pushBot(
          "**Products & inventory**\n\nStock, SKU, images, pricing yahi se. Low-stock alerts dashboard par bhi aate hain.",
          [
            { label: "Products", value: "nav:/admin/products" },
            { label: "Categories", value: "nav:/admin/categories" },
          ]
        );
        return;
      case "coupons":
        goNav("/admin/coupons", "Coupons");
        return;
      case "users":
        goNav("/admin/users", "Users");
        return;
      case "reviews":
        goNav("/admin/reviews", "Reviews");
        return;
      case "analytics":
        goNav("/admin/analytics", "Analytics");
        return;
      case "emails":
        goNav("/admin/emails", "Email campaigns");
        return;
      case "storefront":
        goNav("/admin/storefront", "Storefront");
        return;
      case "categories":
        goNav("/admin/categories", "Categories");
        return;
      default:
        pushBot(
          "Samajh nahi aaya? Try: **orders**, **stock**, **coupon**, **analytics**, ya **What can you do?**",
          [
            { label: "What can you do?", value: "action:capabilities" },
            { label: "Quick stats", value: "action:quick_stats" },
            ...INITIAL_ACTIONS.filter((a) => a.value.startsWith("nav:")).slice(0, 4),
          ]
        );
    }
  };

  const handleAction = (value: string) => {
    if (value.startsWith("nav:")) {
      const path = value.slice(4);
      if (path.startsWith("/")) router.push(path);
      return;
    }
    if (
      value === "action:quick_stats" ||
      value === "action:capabilities" ||
      value === "action:help_workflow" ||
      value === "action:help_advanced"
    ) {
      void submitUserText(value);
      return;
    }
    void submitUserText(value);
  };

  const submitUserText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing || loadingStats) return;
    const display =
      trimmed === "action:quick_stats"
        ? "Quick stats"
        : trimmed === "action:capabilities"
          ? "What can you do?"
          : trimmed === "action:help_workflow"
            ? "Order workflow tips"
            : trimmed === "action:help_advanced"
              ? "Advanced ideas"
              : trimmed;
    if (!trimmed.startsWith("action:")) setInput("");
    setMessages((prev) => [...prev, userMessage(display)].slice(-MAX_MESSAGES));
    respond(trimmed);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[80] flex flex-col items-end gap-2 pointer-events-none [&>*]:pointer-events-auto">
      {open && (
        <div
          data-lenis-prevent
          className="w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] h-[74vh] sm:h-[600px] bg-white rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col ring-1 ring-gold-500/20"
        >
          <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-navy-950 text-white px-4 py-3 shrink-0 border-b border-gold-500/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Admin only
                </p>
                <h3 className="text-base font-bold flex items-center gap-2 mt-0.5">
                  <Sparkles className="h-4 w-4 text-gold-300" />
                  Rani Admin Copilot
                </h3>
                <p className="text-xs text-white/60 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3 w-3 text-gold-400" /> Shortcuts
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-gold-400" /> Live stats
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-gold-400" /> Tips
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center shrink-0"
                aria-label="Close admin assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-3 py-3 bg-gray-50">
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex gap-2", m.sender === "user" ? "justify-end" : "justify-start")}>
                  {m.sender === "bot" && (
                    <div className="h-8 w-8 rounded-full bg-gray-900 text-gold-300 shrink-0 flex items-center justify-center border border-gold-500/40">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                      m.sender === "user"
                        ? "bg-rose-700 text-white rounded-br-md"
                        : "bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm"
                    )}
                  >
                    <div className="[&_a]:text-brand-600 [&_a]:underline">{renderText(m.text)}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.actions.map((a) => (
                          <button
                            key={`${m.id}_${a.value}`}
                            type="button"
                            onClick={() => handleAction(a.value)}
                            className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-800 hover:bg-gold-50 hover:border-gold-300 transition-colors"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.sender === "user" && (
                    <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 shrink-0 flex items-center justify-center">
                      <UserRound className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {(typing || loadingStats) && (
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-900 text-gold-300 shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border rounded-2xl px-3 py-2 text-sm text-gray-500 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingStats ? "Loading stats…" : "…"}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="shrink-0 px-3 py-2 border-t border-gray-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitUserText(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. orders, stock, coupon, workflow, advanced…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                maxLength={400}
              />
              <button
                type="submit"
                disabled={!input.trim() || typing || loadingStats}
                className="h-10 w-10 rounded-xl bg-gray-900 text-gold-300 hover:bg-gray-800 disabled:opacity-50 inline-flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400">
              <button
                type="button"
                onClick={() => handleAction("action:capabilities")}
                className="text-gold-800 hover:underline inline-flex items-center gap-0.5"
              >
                <Lightbulb className="h-3 w-3" /> What can you do?
              </button>
              <div className="flex items-center gap-2">
                <Link href="/admin" className="hover:text-gray-600 inline-flex items-center gap-0.5">
                  <LayoutDashboard className="h-3 w-3" /> Dashboard
                </Link>
                <Link href="/" className="inline-flex items-center gap-0.5 hover:text-gray-600" target="_blank">
                  Store <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <div className="flex flex-col items-end gap-2">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-600 bg-gray-900/95 px-3 py-1.5 shadow-lg text-[11px] text-gold-100/90">
            <LayoutDashboard className="h-3.5 w-3.5 text-gold-400" />
            Admin Copilot
          </div>
          <div className="relative w-[3.5rem] h-[3.5rem] sm:w-16 sm:h-16 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 text-gold-300 shadow-xl border border-gold-500/40 hover:scale-105 active:scale-95 transition-transform inline-flex items-center justify-center"
              aria-label="Open admin assistant"
            >
              <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" />
            </button>
            <span
              className="absolute top-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-500 border-2 border-gray-900 shadow-sm"
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  );
}
