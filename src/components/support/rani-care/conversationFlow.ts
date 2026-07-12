import { normalizeForIntent } from "./textNormalize";
import type { QuickAction } from "./types";

/** Active bot prompt the user can answer with yes / no / short replies */
export type OrderPickPurpose = "track" | "cancel" | "return" | "general";

export type PendingPrompt =
  | { type: "cancel_order"; orderId: string }
  | {
      type: "pick_order";
      orderIds: string[];
      purpose: OrderPickPurpose;
      query?: string;
    };

export const MENU_ACTIONS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "Track order", value: "where is my order" },
  { label: "Cancel order", value: "action:cancel_help" },
  { label: "Returns", value: "action:return_help" },
  { label: "Contact us", value: "contact support" },
];

export const FOLLOW_UP_ACTIONS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "More help", value: "action:menu" },
  { label: "Contact", value: "contact support" },
];

const YES_RE =
  /^(yes|yeah|yep|yup|sure|ok|okay|confirm|correct|right|haan|han|ji|ha)\b/i;
const NO_RE =
  /^(no|nope|nah|dont|don't|stop|nevermind|never mind|cancel that|not really)\b/i;
const NO_THANKS_RE =
  /\b(no thanks|not now|nothing else|i'?m good|im good|all good|that'?s all|thats all|bas)\b/i;
const THANKS_RE =
  /\b(thanks|thank you|thanku|thx|ty|shukriya|dhanyavaad|appreciate it)\b/i;
const ANYTHING_ELSE_RE =
  /\b(anything else|something else|what else|help with something|other help|another question)\b/i;
const GREETING_RE =
  /^(hi+|hey+|hello+|hola|namaste|good\s*(morning|evening|afternoon)|sup|yo|hlw|helo)\b[!. ]*$/i;
const BYE_RE = /\b(bye|goodbye|see you|good night)\b/i;

export function matchAffirmation(raw: string): "yes" | "no" | null {
  const q = normalizeForIntent(raw).trim();
  if (!q) return null;
  if (NO_THANKS_RE.test(q) || NO_RE.test(q)) return "no";
  if (YES_RE.test(q)) return "yes";
  if (/\b(no)\b/.test(q) && /\b(thanks|thank)\b/.test(q)) return "no";
  return null;
}

export function isGreeting(raw: string): boolean {
  return GREETING_RE.test(normalizeForIntent(raw).trim());
}

export function isThanks(raw: string): boolean {
  const q = normalizeForIntent(raw);
  if (NO_THANKS_RE.test(q)) return false;
  return THANKS_RE.test(q);
}

export function isAnythingElse(raw: string): boolean {
  return ANYTHING_ELSE_RE.test(normalizeForIntent(raw));
}

export function isGoodbye(raw: string): boolean {
  return BYE_RE.test(normalizeForIntent(raw)) || NO_THANKS_RE.test(normalizeForIntent(raw));
}

const ABUSE_RE =
  /\b(fuck|fuk|fck|f\*+ck|stfu|shut up|bitch|bastard|asshole|dick|idiot|stupid|nonsense|useless|bekaar|bekar|bakwaas|bakwas|chutiya|chutiye|bhosdi|bhosda|madarchod|madarchd|mc|bc|bhenchod|behenchod|gaali|gali|randi|lund|gaand|gand|harami|kutte|kutta|kamina)\b/i;

/** Profanity / abuse — handle gracefully instead of sending to the AI. */
export function isAbuse(raw: string): boolean {
  return ABUSE_RE.test(raw) || ABUSE_RE.test(normalizeForIntent(raw));
}

/** Infer pending prompt from the latest bot message quick actions */
export function inferPendingFromActions(
  actions: QuickAction[] | undefined,
): PendingPrompt | null {
  if (!actions?.length) return null;
  for (const a of actions) {
    if (a.value.startsWith("cancel_confirm:")) {
      return {
        type: "cancel_order",
        orderId: a.value.slice("cancel_confirm:".length),
      };
    }
  }
  return null;
}
