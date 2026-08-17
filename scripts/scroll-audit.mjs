#!/usr/bin/env node
/**
 * Phase-0 scroll baseline audit — static checks for known jank / blank-page causes.
 * Run: npm run scroll:audit
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "src");

const findings = [];
const passes = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules") continue;
      walk(p, acc);
    } else if (/\.(tsx?|css)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const files = walk(SRC);
const fileContents = new Map(
  files.map((p) => [relative(ROOT, p).replace(/\\/g, "/"), readFileSync(p, "utf8")]),
);

// --- Check 1: dead sticky pin hook (refs unused in ShopFilterBar) ---
const filterBar = fileContents.get("src/components/shop/ShopFilterBar.tsx") ?? "";
if (filterBar.includes("useShopFilterStickyPin")) {
  const refsUsed =
    filterBar.includes("sentinelRef") &&
    (filterBar.includes("ref={sentinelRef}") || filterBar.includes("ref={toolbarRef}"));
  if (!refsUsed) {
    findings.push({
      id: "dead-sticky-pin",
      severity: "high",
      area: "desktop shop scroll",
      message:
        "useShopFilterStickyPin runs scroll/Lenis listeners but refs are never attached to DOM.",
    });
  }
} else {
  passes.push("dead-sticky-pin removed");
}

// --- Check 2: shop cards missing Lenis scroll-hover guard ---
const shopCard = fileContents.get("src/components/shop/ShopCollectionCard.tsx") ?? "";
if (shopCard && !shopCard.includes("card-hover-zoom")) {
  findings.push({
    id: "shop-card-hover-guard",
    severity: "medium",
    area: "desktop shop scroll",
    message: "ShopCollectionCard image lacks card-hover-zoom (Lenis scroll transform freeze).",
  });
} else if (shopCard.includes("card-hover-zoom")) {
  passes.push("shop-card-hover-guard present");
}

// --- Check 3: global overscroll (mobile blank risk) ---
const globals = fileContents.get("src/app/globals.css") ?? "";
const overscrollMobileSafe =
  /overscroll-behavior-y:\s*auto/.test(globals) &&
  /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/.test(globals) &&
  /overscroll-behavior-y:\s*none/.test(globals);
if (!overscrollMobileSafe && /overscroll-behavior-y:\s*none/.test(globals)) {
  findings.push({
    id: "overscroll-none",
    severity: "medium",
    area: "mobile blank on pull-down",
    message: "body uses overscroll-behavior-y: none globally — known iOS Safari blank-gap risk.",
  });
} else if (overscrollMobileSafe) {
  passes.push("overscroll split mobile/desktop");
}

// --- Check 4: navbar transform hide ---
const navStyles = fileContents.get("src/lib/navbarStyles.ts") ?? "";
const navUsesTransformHide =
  navStyles.includes("-translate-y-full") || navStyles.includes("will-change-transform");
if (navUsesTransformHide) {
  findings.push({
    id: "nav-transform-hide",
    severity: "medium",
    area: "mobile blank on scroll-up",
    message: "Navbar uses sticky + translate hide — WebKit compositor repaint risk.",
  });
} else if (navStyles.includes("max-h-0") || navStyles.includes("max-h-[12rem]")) {
  passes.push("nav collapse hide (no transform)");
}

const navbar = fileContents.get("src/components/layout/Navbar.tsx") ?? "";
if (navbar.includes("!showCommerceMobileShell") && navbar.includes("navAutoHideEnabled")) {
  passes.push("commerce nav auto-hide disabled");
}

// --- Check 5: body scroll lock safety on route change ---
const smooth = fileContents.get("src/components/providers/SmoothScroll.tsx") ?? "";
if (!smooth.includes("forceUnlockBodyScroll")) {
  findings.push({
    id: "body-lock-safety",
    severity: "high",
    area: "mobile frozen/blank page",
    message: "No forceUnlockBodyScroll on route change — body can stay position:fixed after modals.",
  });
} else {
  passes.push("body-lock route safety present");
}

// --- Check 6: parallel window scroll listeners (Phase 3 target: bus) ---
let windowScrollListeners = 0;
const listenerPatterns = [
  /addEventListener\s*\(\s*["']scroll["']/g,
  /lenis\.on\s*\(\s*["']scroll["']/g,
];
for (const [rel, content] of fileContents) {
  if (
    rel.includes("hooks/useMobileNavAutoHide") ||
    rel.includes("components/layout/Navbar.tsx") ||
    rel.includes("providers/SmoothScroll.tsx")
  ) {
    continue;
  }
  if (!rel.includes("hooks/") && !rel.includes("components/") && !rel.includes("providers/")) {
    continue;
  }
  for (const re of listenerPatterns) {
    const m = content.match(re);
    if (m) windowScrollListeners += m.length;
  }
}
const scrollBus = fileContents.get("src/lib/windowScrollBus.ts") ?? "";
if (scrollBus.includes("subscribeWindowScroll")) {
  passes.push("window scroll bus present");
}
findings.push({
  id: "scroll-listener-count",
  severity: "info",
  area: "desktop jank",
  message: `${windowScrollListeners} direct window scroll listeners outside scroll bus (down from 8 baseline).`,
});

// --- Check 7: Lenis scoped to marketing paths ---
const scrollSurface = fileContents.get("src/lib/scrollSurface.ts") ?? "";
const smoothScroll = fileContents.get("src/components/providers/SmoothScroll.tsx") ?? "";
if (
  scrollSurface.includes("isLenisMarketingPath") &&
  smoothScroll.includes("shouldEnableLenisSmoothScrollForPath")
) {
  passes.push("lenis scoped to marketing routes");
} else {
  findings.push({
    id: "lenis-global",
    severity: "info",
    area: "desktop jank",
    message: "Lenis still enabled globally on desktop — scope to marketing pages in Phase 3.",
  });
}

// --- Report ---
console.log("\n=== PIA Scroll Audit (Phase 0 baseline) ===\n");

if (passes.length) {
  console.log("PASS:");
  for (const p of passes) console.log(`  ✓ ${p}`);
  console.log("");
}

const bySeverity = { high: [], medium: [], info: [] };
for (const f of findings) bySeverity[f.severity]?.push(f);

for (const sev of ["high", "medium", "info"]) {
  const list = bySeverity[sev];
  if (!list.length) continue;
  console.log(`${sev.toUpperCase()}:`);
  for (const f of list) {
    console.log(`  [${f.area}] ${f.message}`);
  }
  console.log("");
}

const blockers = findings.filter((f) => f.severity === "high");
console.log(
  blockers.length ?
    `Action: fix ${blockers.length} high-severity item(s) before next phase.`
  : "All scroll phases complete. INFO lines are optional follow-ups.",
);
console.log("");

process.exit(blockers.length ? 1 : 0);
