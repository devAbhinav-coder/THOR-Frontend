import {
  PDP_SIZE_GUIDE_PRESETS,
  type PdpSizeGuideContent,
} from "@/lib/pdpSizeGuidePresets";

export type PdpSizeGuideData = {
  enabled?: boolean;
  title?: string;
  intro?: string;
  rows?: { size: string; detail: string }[];
  tips?: string[];
};

/** Category-based fallback when admin enables size guide but leaves content empty. */
export function getPdpSizeGuideContent(input: {
  category?: string;
  productName?: string;
  sizes: string[];
}): PdpSizeGuideContent {
  const cat = (input.category || "").toLowerCase();
  const sizes = input.sizes.map((s) => s.trim()).filter(Boolean);
  const hasFreeSize = sizes.some((s) => /free/i.test(s));

  if (hasFreeSize || /saree|sari|dupatta|unstitched/i.test(cat)) {
    return PDP_SIZE_GUIDE_PRESETS.saree.content;
  }

  if (/salwar|sharara|anarkali|kurta set|punjabi|palazzo set/i.test(cat)) {
    return PDP_SIZE_GUIDE_PRESETS.salwar.content;
  }

  if (/corset|top|blouse|shirt/i.test(cat)) {
    return PDP_SIZE_GUIDE_PRESETS.fitted.content;
  }

  return {
    title: "Size guide",
    intro: `Use this chart for ${input.productName || "this piece"}. Measurements are approximate.`,
    rows:
      sizes.length > 0 ?
        sizes.map((size) => ({
          size,
          detail: "Refer to product details for fabric stretch and fit notes.",
        }))
      : PDP_SIZE_GUIDE_PRESETS.generic.content.rows,
    tips: PDP_SIZE_GUIDE_PRESETS.generic.content.tips,
  };
}

/** Resolve modal content — returns null when size guide should not show on PDP. */
export function resolvePdpSizeGuideContent(input: {
  sizeGuide?: PdpSizeGuideData;
  category?: string;
  productName?: string;
  sizes: string[];
}): PdpSizeGuideContent | null {
  if (!input.sizeGuide?.enabled) return null;

  const fallback = getPdpSizeGuideContent({
    category: input.category,
    productName: input.productName,
    sizes: input.sizes,
  });

  const sg = input.sizeGuide;
  const hasCustomRows = (sg.rows?.length ?? 0) > 0;

  return {
    title: sg.title?.trim() || fallback.title,
    intro: sg.intro?.trim() || fallback.intro,
    rows: hasCustomRows ? sg.rows! : fallback.rows,
    tips: sg.tips?.length ? sg.tips : fallback.tips,
  };
}
