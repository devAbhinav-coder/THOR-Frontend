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
  ivorywhite: "#fffff0",
  ivorygold: "#f5e6c8",
  pearl: "#faf7f2",
  eggshell: "#f9f6ee",
  cream: "#fffdd0",
  beige: "#f5f5dc",
  warmbeige: "#e8d5b7",
  sand: "#e7dcc7",
  nude: "#e7c6b0",
  taupe: "#8b7d7b",
  tan: "#d2b48c",
  khaki: "#c3b091",
  ecru: "#c2b280",
  ecrucharm: "#c2b280",

  // Reds / Pinks
  red: "#ef4444",
  crimson: "#dc2626",
  scarlet: "#f43f5e",
  burgundy: "#7f1d1d",
  wine: "#7f1d1d",
  winered: "#7f1d1d",
  vintagewine: "#6b1e2a",
  maroon: "#800000",
  pastelmaroon: "#a85c6a",
  rose: "#fb7185",
  pink: "#ec4899",
  babypink: "#f9a8d4",
  peachpink: "#f9a8c9",
  tarangpink: "#e879a9",
  hotpink: "#ff69b4",
  magenta: "#d946ef",
  fuchsia: "#d946ef",
  blush: "#fbcfe8",
  blushpink: "#fbcfe8",

  // Purples
  purple: "#a855f7",
  violet: "#8b5cf6",
  lavender: "#c4b5fd",
  lilac: "#d8b4fe",

  // Blues
  navy: "#0f172a",
  navyblue: "#1e3a5f",
  midnightblue: "#0b1b3a",
  midnightnavy: "#0b1b3a",
  royalblue: "#2563eb",
  cobalt: "#1d4ed8",
  blue: "#3b82f6",
  skyblue: "#38bdf8",
  babyblue: "#7dd3fc",
  powderblue: "#bae6fd",
  tealblue: "#0f766e",
  mintblue: "#7dd3c0",
  indigoblue: "#4338ca",
  indigo: "#6366f1",

  // Greens
  green: "#22c55e",
  emerald: "#10b981",
  emeraldgreen: "#10b981",
  mint: "#86efac",
  mintgreen: "#86efac",
  olive: "#808000",
  olivegreen: "#6b8e23",
  pistagreen: "#93c572",
  sage: "#84a98c",
  seagreen: "#2e8b57",
  forestgreen: "#166534",
  bottlegreen: "#14532d",

  // Yellows / Oranges
  yellow: "#eab308",
  mustard: "#ca8a04",
  mustardyellow: "#ca8a04",
  kesariya: "#e85d04",
  amber: "#f59e0b",
  gold: "#d4af37",
  antiquegold: "#c5a059",
  champagne: "#f7e7ce",
  orange: "#f97316",
  sunsetorange: "#f97316",
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
  royalmaroon: "#7f1d1d",

  // Misc
  cyan: "#06b6d4",
  aqua: "#22d3ee",
  teal: "#14b8a6",
};

function colorNameKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  if (/^0x[0-9a-f]{6,8}$/i.test(s)) {
    return expandHex(`#${s.slice(2)}`);
  }

  if (/^[0-9a-f]{3}$/i.test(s) || /^[0-9a-f]{6}$/i.test(s) || /^[0-9a-f]{8}$/i.test(s)) {
    return expandHex(`#${s}`);
  }

  if (/^#[0-9a-f]{3}$/i.test(s) || /^#[0-9a-f]{6}$/i.test(s) || /^#[0-9a-f]{8}$/i.test(s)) {
    return expandHex(s);
  }

  return null;
}

/** Expand #RGB → #RRGGBB; clip alpha for `<input type="color">`. */
function expandHex(hex: string): string {
  const h = hex.trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) {
    const r = h[1]!;
    const g = h[2]!;
    const b = h[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-f]{8}$/i.test(h)) return h.slice(0, 7).toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(h)) return h.toLowerCase();
  return h.toLowerCase();
}

export function normalizeCssColor(
  input?: string | null,
  fallbackName?: string | null,
): string | null {
  const raw = (input ?? "").trim();
  if (raw) {
    const hex = normalizeHex(raw);
    if (hex) return hex;

    if (/^(rgb|rgba|hsl|hsla)\(/i.test(raw)) return raw;
    if (/^[a-z]+$/i.test(raw)) return raw;
  }

  return guessHexFromColorName(fallbackName ?? "") || null;
}

/**
 * Best-effort hex for a color label (Red, Navy Blue, Mustard Yellow…).
 * Used by admin swatch picker when the name changes.
 */
export function guessHexFromColorName(name?: string | null): string | null {
  const key = colorNameKey(name ?? "");
  if (!key) return null;
  if (NAMED_FALLBACKS[key]) return NAMED_FALLBACKS[key];

  let best: { hex: string; len: number } | null = null;
  for (const [k, hex] of Object.entries(NAMED_FALLBACKS)) {
    if (!key.includes(k) && !k.includes(key)) continue;
    if (!best || k.length > best.len) best = { hex, len: k.length };
  }
  return best?.hex ?? null;
}

/** Safe value for `<input type="color">` (#rrggbb). */
export function toColorPickerValue(
  colorCode?: string | null,
  colorName?: string | null,
  fallback = "#8b4513",
): string {
  if ((colorCode ?? "").trim() === "__hr_multicolor") {
    return guessHexFromColorName(colorName) || fallback;
  }
  const fromCode = normalizeHex(String(colorCode ?? ""));
  if (fromCode) return fromCode;
  return guessHexFromColorName(colorName) || fallback;
}
