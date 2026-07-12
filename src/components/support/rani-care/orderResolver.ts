import type { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { findOrderIdByNumber } from "./intent";
import { normalizeForIntent } from "./textNormalize";
import type { Intent } from "./types";

export type OrderPickPurpose = "track" | "cancel" | "return" | "general";

export type OrderResolveResult =
  | { kind: "single"; orderId: string; intro: string }
  | { kind: "pick"; orderIds: string[]; intro: string; purpose: OrderPickPurpose }
  | { kind: "none"; intro: string }
  | { kind: "all" };

function istDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Romanized-Hindi / Hinglish signal words. English-only queries return false
 *  so replies mirror the customer's language. */
const HINGLISH_TOKENS =
  /\b(kal|kl|kaal|aaj|aj|kahan|kaha|kab|mera|mere|meri|kaunsa|konsa|kaun|pehla|dusra|doosra|teesra|chahiye|batao|btao|bata|hai|hua|hoga|kya|kyaa|kitne|kitna|karna|karo|karu|gaya|gayi|wala|wali|tak|paisa|paise|nahi|haan|mujhe|bhej|bheja|milega|aayega|ayega|ka|ke|ki|abhi)\b/;

export function isHinglishQuery(query: string): boolean {
  return HINGLISH_TOKENS.test(query.toLowerCase());
}

function prefersHinglish(query: string): boolean {
  return isHinglishQuery(query);
}

export type OrderAspect =
  | "payment"
  | "eta"
  | "tracking"
  | "items"
  | "total"
  | "status"
  | "general";

/** What is the customer asking ABOUT a specific order? */
export function detectOrderAspect(query: string): OrderAspect {
  const raw = query.toLowerCase();
  const q = `${raw} ${normalizeForIntent(query)}`;

  if (
    /\b(paid|payment|pay|paisa|paise|amount paid|charge|charged|razorpay|upi|cod|paise kat|paisa kat|payment hua|paid hai|paid hai kya|bill)\b/.test(
      q,
    )
  ) {
    return "payment";
  }
  if (
    /\b(kab tak|kab aayega|kab ayega|kab milega|kab aaega|when.*(arrive|deliver|come|reach)|eta|expected|delivery date|kitne din|kitna time|how many days|how long|days left)\b/.test(
      q,
    )
  ) {
    return "eta";
  }
  if (/\b(track|tracking|awb|waybill|courier|carrier|parcel|shipment)\b/.test(q)) {
    return "tracking";
  }
  if (/\b(kya kya|what.*(items|products|ordered)|items|contents|kaunsa product|which product)\b/.test(q)) {
    return "items";
  }
  if (/\b(total|kitne ka|kitna ka|price|cost|grand total|kitne rupees|kitne rupaye)\b/.test(q)) {
    return "total";
  }
  if (/\b(status|kahan|where|state|update)\b/.test(q)) {
    return "status";
  }
  return "general";
}

function itemNames(order: Order, max = 3): string {
  const names = (order.items || []).map((i) => i.name).filter(Boolean);
  if (!names.length) return "items";
  const head = names.slice(0, max).join(", ");
  return names.length > max ? `${head} +${names.length - max}` : head;
}

function paymentMethodLabel(order: Order): string {
  switch (order.paymentMethod) {
    case "cod":
      return "COD";
    case "razorpay":
      return "online";
    case "offline_upi":
      return "UPI";
    case "offline_cash":
      return "cash";
    default:
      return "—";
  }
}

function formatPaymentAnswer(order: Order, hinglish: boolean): string {
  const num = order.orderNumber;
  const total = formatPrice(order.total);
  const method = paymentMethodLabel(order);
  const isCod = order.paymentMethod === "cod";

  if (order.paymentStatus === "paid") {
    return hinglish ?
        `Haan, order **${num}** ka payment **ho chuka** hai — ${total} (${method}).`
      : `Yes, order **${num}** is **paid** — ${total} (${method}).`;
  }
  if (order.paymentStatus === "refunded") {
    return hinglish ?
        `Order **${num}** ka payment **refund** ho chuka hai (${total}).`
      : `Order **${num}** has been **refunded** (${total}).`;
  }
  if (order.paymentStatus === "failed") {
    return hinglish ?
        `Order **${num}** ka payment **fail** hua tha. Debit hua ho to 3–7 business days mein wapas aa jata hai.`
      : `Payment for order **${num}** **failed**. If money was debited, it usually reverses in 3–7 business days.`;
  }
  // pending
  if (isCod) {
    return hinglish ?
        `Order **${num}** **COD** hai — delivery ke waqt **${total}** cash dena hai (abhi payment pending).`
      : `Order **${num}** is **COD** — pay **${total}** in cash at delivery (currently pending).`;
  }
  return hinglish ?
      `Order **${num}** ka payment abhi **pending** hai (${total}, ${method}).`
    : `Payment for order **${num}** is still **pending** (${total}, ${method}).`;
}

function formatEtaAnswer(order: Order, hinglish: boolean): string {
  const num = order.orderNumber;
  const status = order.status;
  const tat = order.delhivery?.estimatedTatDays ?? null;

  if (status === "delivered") {
    const when = order.deliveredAt ? ` (${formatDate(order.deliveredAt)})` : "";
    return hinglish ?
        `Order **${num}** already **deliver** ho chuka hai${when}.`
      : `Order **${num}** has already been **delivered**${when}.`;
  }
  if (status === "cancelled") {
    return hinglish ?
        `Order **${num}** **cancel** ho chuka hai, isliye koi delivery nahi hogi.`
      : `Order **${num}** was **cancelled**, so there is no delivery.`;
  }
  if (status === "shipped") {
    const etaLine =
      tat && tat > 0 ?
        hinglish ?
          `Estimated **${tat} business days** mein pahunch jayega.`
        : `Estimated **${tat} business days** to arrive.`
      : hinglish ?
        `Dispatch ke baad aam taur par **3–10 business days** lagte hain.`
      : `After dispatch it usually takes **3–10 business days**.`;
    const shipped = order.shippedAt ? ` (shipped ${formatDate(order.shippedAt)})` : "";
    return hinglish ?
        `Order **${num}** **ship** ho chuka hai${shipped}. ${etaLine}`
      : `Order **${num}** is **shipped**${shipped}. ${etaLine}`;
  }
  if (["pending", "confirmed", "processing"].includes(status)) {
    return hinglish ?
        `Order **${num}** abhi **${status}** hai. Pehle **1–3 business days** mein dispatch hota hai, phir delivery mein **3–10 business days** lagte hain.`
      : `Order **${num}** is **${status}**. It ships in **1–3 business days**, then delivery takes **3–10 business days**.`;
  }
  return formatTrackingBlurb(order, hinglish);
}

function formatItemsAnswer(order: Order, hinglish: boolean): string {
  const num = order.orderNumber;
  const list = (order.items || [])
    .slice(0, 6)
    .map((i) => `• ${i.name} × ${i.quantity}`)
    .join("\n");
  const more = (order.items?.length || 0) > 6 ? `\n• +${(order.items?.length || 0) - 6} more` : "";
  return hinglish ?
      `Order **${num}** mein ye items hain:\n${list}${more}`
    : `Order **${num}** contains:\n${list}${more}`;
}

function formatTotalAnswer(order: Order, hinglish: boolean): string {
  const num = order.orderNumber;
  const total = formatPrice(order.total);
  return hinglish ?
      `Order **${num}** ka total **${total}** hai (${itemNames(order)}).`
    : `Order **${num}** total is **${total}** (${itemNames(order)}).`;
}

/** Answer the SPECIFIC thing the customer asked about one order, in their language. */
export function formatOrderAnswer(
  order: Order,
  query: string,
  hinglish = isHinglishQuery(query),
): string {
  const aspect = detectOrderAspect(query);
  switch (aspect) {
    case "payment":
      return formatPaymentAnswer(order, hinglish);
    case "eta":
      return formatEtaAnswer(order, hinglish);
    case "items":
      return formatItemsAnswer(order, hinglish);
    case "total":
      return formatTotalAnswer(order, hinglish);
    case "tracking":
    case "status":
    case "general":
    default:
      return formatTrackingBlurb(order, hinglish);
  }
}

const YESTERDAY_RE = /\b(kal|kl|kaal|yesterday|pichle din|previous day)\b/;
const TODAY_RE = /\b(aaj|aj|aaz|today)\b/;
const LATEST_RE = /\b(last order|latest|recent|sabse naya|naya order|abhi wala|newest)\b/;

function temporalFilter(orders: Order[], query: string): Order[] | null {
  const q = normalizeForIntent(query);
  const todayKey = istDateKey(new Date());

  if (YESTERDAY_RE.test(q)) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = istDateKey(y);
    return orders.filter((o) => istDateKey(new Date(o.createdAt)) === yKey);
  }

  if (TODAY_RE.test(q)) {
    return orders.filter((o) => istDateKey(new Date(o.createdAt)) === todayKey);
  }

  if (LATEST_RE.test(q)) {
    return orders.length ? [orders[0]] : [];
  }

  return null;
}

function statusFilter(orders: Order[], query: string): Order[] | null {
  const q = normalizeForIntent(query);
  if (/\b(shipped|dispatch|courier|transit|nikal)\b/.test(q)) {
    return orders.filter((o) => o.status === "shipped");
  }
  if (/\b(delivered|deliver ho|pahunch|aa gaya|mil gaya)\b/.test(q)) {
    return orders.filter((o) => o.status === "delivered");
  }
  if (/\b(pending|confirmed|processing|tayyar|pack)\b/.test(q)) {
    return orders.filter((o) =>
      ["pending", "confirmed", "processing"].includes(o.status),
    );
  }
  if (/\b(cancel|cancelled)\b/.test(q)) {
    return orders.filter((o) => o.status === "cancelled");
  }
  return null;
}

function activeOrders(orders: Order[]): Order[] {
  return orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
}

function productHintFilter(orders: Order[], query: string): Order[] | null {
  const q = normalizeForIntent(query);
  const words = q.split(/\s+/).filter((w) => w.length >= 4);
  if (!words.length) return null;

  const hits = orders.filter((o) => {
    const blob = (o.items || [])
      .map((i) => `${i.name} ${i.variant?.color || ""} ${i.variant?.size || ""}`)
      .join(" ")
      .toLowerCase();
    return words.some((w) => blob.includes(w));
  });
  return hits.length ? hits : null;
}

function orderNumberFilter(orders: Order[], query: string): Order[] | null {
  const id = findOrderIdByNumber(query, orders);
  if (!id) return null;
  const hit = orders.find((o) => o._id === id);
  return hit ? [hit] : null;
}

/** "kal koi order nahi tha" style message when an explicit day has no orders. */
function noOrdersForDayMsg(query: string, hinglish: boolean): string {
  const q = normalizeForIntent(query);
  if (YESTERDAY_RE.test(q)) {
    return hinglish ?
        "Kal koi order place nahi hua tha. Aapke recent orders **My orders** se dekh sakte ho."
      : "You didn't place any order yesterday. You can view recent orders from **My orders**.";
  }
  if (TODAY_RE.test(q)) {
    return hinglish ?
        "Aaj koi order place nahi hua hai. Aapke recent orders **My orders** se dekh sakte ho."
      : "You haven't placed any order today. You can view recent orders from **My orders**.";
  }
  return hinglish ?
      "Us din koi order nahi mila. Neeche **My orders** se recent orders dekh lo."
    : "No order found for that day. See recent orders from **My orders**.";
}

export function formatTrackingBlurb(order: Order, hinglish: boolean): string {
  const num = order.orderNumber;
  const status = order.status;
  const tracking = order.trackingNumber;

  if (status === "delivered") {
    return hinglish ?
        `**${num}** deliver ho chuka hai.`
      : `Order **${num}** has been **delivered**.`;
  }
  if (status === "shipped") {
    const track =
      tracking ?
        hinglish ?
          `Tracking: **${tracking}**${order.shippingCarrier ? ` (${order.shippingCarrier})` : ""}.`
        : `Tracking: **${tracking}**${order.shippingCarrier ? ` · ${order.shippingCarrier}` : ""}.`
      : hinglish ?
        "Tracking number jald update hoga."
      : "Tracking will appear once the carrier scans the parcel.";
    return hinglish ?
        `**${num}** ship ho chuka hai — ab courier ke paas hai.\n${track}`
      : `Order **${num}** is **shipped**.\n${track}`;
  }
  if (["pending", "confirmed", "processing"].includes(status)) {
    return hinglish ?
        `**${num}** abhi **${status}** hai — dispatch hone par tracking milega. Aksar 1–3 business days mein ship hota hai.`
      : `Order **${num}** is **${status}** — tracking appears after dispatch (usually 1–3 business days).`;
  }
  if (status === "cancelled") {
    return hinglish ?
        `**${num}** cancel ho chuka hai.`
      : `Order **${num}** was **cancelled**.`;
  }
  return hinglish ?
      `**${num}** — status: **${status}**.`
    : `Order **${num}** — status: **${status}**.`;
}

function buildPickIntro(
  matches: Order[],
  query: string,
  purpose: OrderPickPurpose,
): string {
  const hinglish = prefersHinglish(query);
  const n = matches.length;
  const q = normalizeForIntent(query);

  // Hinglish uses a prefix ("kal ke"), English uses a suffix ("from yesterday").
  let whenHi = "";
  let whenEn = "";
  if (YESTERDAY_RE.test(q)) {
    whenHi = "kal ke ";
    whenEn = " from yesterday";
  } else if (TODAY_RE.test(q)) {
    whenHi = "aaj ke ";
    whenEn = " from today";
  }

  const plural = n === 1 ? "order" : "orders";

  if (hinglish) {
    if (purpose === "cancel") {
      return `Aapke **${whenHi}${n} ${plural}** hain. Kaunsa **cancel** karna hai — neeche se chuno ya **1 / 2** bhejo.`;
    }
    if (purpose === "return") {
      return `Aapke **${whenHi}${n} ${plural}** hain. Kis order ka **return** karna hai — neeche chuno.`;
    }
    return `Aapke **${whenHi}${n} ${plural}** hain. **Kaunsa** order dekhna hai — neeche chuno ya **1 / 2** likh kar bhejo.`;
  }

  if (purpose === "cancel") {
    return `You have **${n} ${plural}**${whenEn}. Which one to **cancel**? Pick below or reply **1** / **2**.`;
  }
  if (purpose === "return") {
    return `You have **${n} ${plural}**${whenEn}. Which order to **return**? Pick below.`;
  }
  return `You have **${n} ${plural}**${whenEn}. **Which one** should I open? Pick below or reply **1** / **2**.`;
}

function purposeFromIntent(intent: Intent): OrderPickPurpose {
  if (intent === "cancel_help") return "cancel";
  if (intent === "returns") return "return";
  if (intent === "show_orders") return "track";
  return "general";
}

export function resolveOrdersFromQuery(
  orders: Order[],
  query: string,
  intent: Intent,
): OrderResolveResult {
  const hinglish = prefersHinglish(query);
  const purpose = purposeFromIntent(intent);

  if (!orders.length) {
    return {
      kind: "none",
      intro:
        hinglish ?
          "Abhi koi order nahi mila. Order place karne ke baad yahan track kar paoge."
        : "You have no orders yet. After you place one, it will show up here.",
    };
  }

  const single = (o: Order): OrderResolveResult => ({
    kind: "single",
    orderId: o._id,
    intro: formatOrderAnswer(o, query, hinglish),
  });
  const pick = (pool: Order[]): OrderResolveResult => ({
    kind: "pick",
    orderIds: pool.map((o) => o._id),
    intro: buildPickIntro(pool, query, purpose),
    purpose,
  });

  // 1) Explicit order number always wins.
  const byNumber = orderNumberFilter(orders, query);
  if (byNumber?.length === 1) return single(byNumber[0]);

  // 2) Explicit day (kal / aaj / latest). If the day is empty, say so —
  //    never fall back to dumping every order.
  const temporal = temporalFilter(orders, query);
  if (temporal !== null) {
    if (temporal.length === 0) {
      return { kind: "none", intro: noOrdersForDayMsg(query, hinglish) };
    }
    let pool = temporal;
    const byStatus = statusFilter(pool, query);
    if (byStatus?.length) pool = byStatus;
    const byProduct = productHintFilter(pool, query);
    if (byProduct?.length) pool = byProduct;
    return pool.length === 1 ? single(pool[0]) : pick(pool);
  }

  // 3) Status / product filters (no explicit day).
  let pool = [...orders];
  const byStatus = statusFilter(pool, query);
  if (byStatus) pool = byStatus;
  const byProduct = productHintFilter(pool, query);
  if (byProduct) pool = byProduct;

  if (pool.length === 1) return single(pool[0]);
  if (pool.length > 0 && pool.length < orders.length) return pick(pool);

  // 4) Vague question with no filter match — use active orders only.
  const aspect = detectOrderAspect(query);
  const isVagueOrderQuestion =
    (purpose === "track" || purpose === "general") &&
    (aspect !== "general" ||
      /\b(kahan|where|track|status|kab|paid|payment|eta)\b/.test(
        normalizeForIntent(query),
      ));
  if (isVagueOrderQuestion) {
    const act = activeOrders(orders);
    if (act.length === 1) return single(act[0]);
    if (act.length > 1) return pick(act);
  }

  return { kind: "all" };
}

const ORDINAL_MAP: Record<string, number> = {
  pehla: 0,
  pehle: 0,
  pahla: 0,
  first: 0,
  "1": 0,
  ek: 0,
  dusra: 1,
  doosra: 1,
  second: 1,
  "2": 1,
  do: 1,
  teesra: 2,
  third: 2,
  "3": 2,
  teen: 2,
};

export function resolvePickReply(
  text: string,
  orderIds: string[],
  orders: Order[],
): string | null {
  const q = normalizeForIntent(text).trim();
  if (!q) return null;

  for (const [word, idx] of Object.entries(ORDINAL_MAP)) {
    if (idx >= orderIds.length) continue;
    if (new RegExp(`\\b${word}\\b`).test(q)) return orderIds[idx];
  }

  const pool = orders.filter((o) => orderIds.includes(o._id));
  return findOrderIdByNumber(text, pool);
}
