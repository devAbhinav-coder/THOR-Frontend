const NAMED_FALLBACKS: Record<string, string> = {
  // Neutrals
  black: "#000000",
  jetblack: "#0a0a0a",
  midnightblack: "#0b0f1a",
  richblack: "#020617",
  charcoal: "#1f2937",
  graphite: "#111827",
  onyx: "#0f172a",
  slate: "#334155",
  ash: "#9ca3af",
  gray: "#9ca3af",
  grey: "#9ca3af",
  lightgray: "#d1d5db",
  lightgrey: "#d1d5db",
  silver: "#c0c0c0",
  white: "#ffffff",
  offwhite: "#f8fafc",
  ivory: "#fffff0",
  pearl: "#faf7f2",
  eggshell: "#f9f6ee",
  cream: "#fffdd0",
  beige: "#f5f5dc",
  sand: "#e7dcc7",
  nude: "#e7c6b0",
  taupe: "#8b7d7b",
  tan: "#d2b48c",
  khaki: "#c3b091",

  // Reds / Pinks
  red: "#ef4444",
  crimson: "#dc2626",
  scarlet: "#f43f5e",
  burgundy: "#7f1d1d",
  wine: "#7f1d1d",
  maroon: "#800000",
  rose: "#fb7185",
  pink: "#ec4899",
  hotpink: "#ff69b4",
  magenta: "#d946ef",
  fuchsia: "#d946ef",
  blush: "#fbcfe8",

  // Purples
  purple: "#a855f7",
  violet: "#8b5cf6",
  lavender: "#c4b5fd",
  lilac: "#d8b4fe",

  // Blues
  navy: "#0f172a",
  midnightblue: "#0b1b3a",
  royalblue: "#2563eb",
  cobalt: "#1d4ed8",
  blue: "#3b82f6",
  skyblue: "#38bdf8",
  babyblue: "#7dd3fc",
  powderblue: "#bae6fd",
  tealblue: "#0f766e",

  // Greens
  green: "#22c55e",
  emerald: "#10b981",
  mint: "#86efac",
  olive: "#808000",
  sage: "#84a98c",
  forestgreen: "#166534",
  bottlegreen: "#14532d",

  // Yellows / Oranges
  yellow: "#eab308",
  mustard: "#ca8a04",
  amber: "#f59e0b",
  gold: "#d4af37",
  orange: "#f97316",
  tangerine: "#fb923c",
  coral: "#fb7185",
  peach: "#fdba74",
  apricot: "#fbbf24",

  // Browns
  brown: "#8b5a2b",
  chocolate: "#7c2d12",
  coffee: "#4b2e2b",
  mocha: "#6b4f4f",
  camel: "#c19a6b",

  // Misc
  indigo: "#6366f1",
  cyan: "#06b6d4",
  aqua: "#22d3ee",
};

function normalizeHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // 0xFF00FF
  if (/^0x[0-9a-f]{6,8}$/i.test(s)) {
    return `#${s.slice(2)}`;
  }

  // FF00FF or FFF
  if (/^[0-9a-f]{3}$/i.test(s) || /^[0-9a-f]{6}$/i.test(s) || /^[0-9a-f]{8}$/i.test(s)) {
    return `#${s}`;
  }

  // #FF00FF or #FFF or #RRGGBBAA
  if (/^#[0-9a-f]{3}$/i.test(s) || /^#[0-9a-f]{6}$/i.test(s) || /^#[0-9a-f]{8}$/i.test(s)) {
    return s;
  }

  return null;
}

export function normalizeCssColor(input?: string | null, fallbackName?: string | null): string | null {
  const raw = (input ?? "").trim();
  if (raw) {
    const hex = normalizeHex(raw);
    if (hex) return hex;

    // rgb()/rgba()/hsl()/hsla() and CSS named colors pass through.
    // We still guard against obvious non-color strings.
    if (/^(rgb|rgba|hsl|hsla)\(/i.test(raw)) return raw;
    if (/^[a-z]+$/i.test(raw)) return raw;
  }

  const name = (fallbackName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (name) {
    const hex = normalizeHex(name);
    if (hex) return hex;
    return NAMED_FALLBACKS[name] || null;
  }

  return null;
}

