export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheckItem = {
  id: string;
  label: string;
  detail: string;
  status: SeoCheckStatus;
};

export type ProductSeoFormFields = {
  name: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  fabric?: string;
  category?: string;
};

const MIN_META_DESC = 120;
const MAX_META_DESC = 160;
const MIN_TITLE_LEN = 20;
const MAX_TITLE_LEN = 65;

const INDIA_INTENT =
  /\b(india|indian|₹|rupee|pan-india|across india|delivery|return|saree|ethnic)\b/i;

export function evaluateProductSeo(fields: ProductSeoFormFields): {
  items: SeoCheckItem[];
  score: number;
  hasBlockingIssues: boolean;
  suggestedTitle: string;
  suggestedDescription: string;
} {
  const name = fields.name.trim();
  const seoTitle = fields.seoTitle.trim();
  const seoDescription = fields.seoDescription.trim();
  const shortDescription = fields.shortDescription.trim();
  const effectiveDesc = seoDescription || shortDescription;
  const fabricBit = fields.fabric ? `${fields.fabric} ` : "";
  const categoryBit = fields.category ? `${fields.category} ` : "";

  const suggestedTitle =
    name ?
      seoTitle || `Buy ${fabricBit}${name} Online in India`.replace(/\s+/g, " ").trim()
    : "Add product name first";
  const suggestedDescription =
    name ?
      `Shop ${fabricBit}${categoryBit}${name} at The House of Rani. Premium Indian ethnic wear, free delivery over ₹1,099, easy 7-day returns across India.`.slice(
        0,
        MAX_META_DESC,
      )
    : "";

  const items: SeoCheckItem[] = [];

  items.push({
    id: "name",
    label: "Product name",
    detail: name ? "Used in Google title and URL." : "Required before the product can rank.",
    status: name ? "pass" : "fail",
  });

  items.push({
    id: "seo-title",
    label: "SEO title",
    detail:
      seoTitle ?
        seoTitle.length > MAX_TITLE_LEN ?
          `Long (${seoTitle.length} chars) — Google may truncate after ~60.`
        : seoTitle.length < MIN_TITLE_LEN ?
          `Short (${seoTitle.length} chars) — add fabric, occasion, or “saree”.`
        : "Custom title set for search results."
      : name ?
        `Empty — Google will use: “Buy ${name} Online in India”. Add a custom title to target keywords.`
      : "Set after product name.",
    status:
      !name ? "fail"
      : !seoTitle ? "warn"
      : seoTitle.length > MAX_TITLE_LEN || seoTitle.length < MIN_TITLE_LEN ? "warn"
      : "pass",
  });

  items.push({
    id: "seo-description",
    label: "Meta description",
    detail:
      seoDescription ?
        seoDescription.length < MIN_META_DESC ?
          `${seoDescription.length}/${MAX_META_DESC} chars — aim for ${MIN_META_DESC}–${MAX_META_DESC} for better CTR.`
        : `${seoDescription.length}/${MAX_META_DESC} chars — good length for Google snippets.`
      : shortDescription ?
        `Empty — fallback uses short description (${shortDescription.length} chars). Add a dedicated meta description.`
      : name ?
        "Missing — add 120–160 chars with fabric, occasion, delivery & returns."
      : "Set after product name.",
    status:
      !name ? "fail"
      : seoDescription && seoDescription.length >= MIN_META_DESC ? "pass"
      : seoDescription && seoDescription.length > 0 ? "warn"
      : effectiveDesc.length >= MIN_META_DESC ? "warn"
      : "fail",
  });

  items.push({
    id: "india-keywords",
    label: "India shopping intent",
    detail:
      INDIA_INTENT.test(effectiveDesc) || INDIA_INTENT.test(seoTitle) ?
        "Description or title mentions India, saree, delivery, or returns."
      : "Add “India”, “free delivery”, “7-day returns”, or “saree” in the meta description.",
    status:
      INDIA_INTENT.test(effectiveDesc) || INDIA_INTENT.test(seoTitle) ? "pass" : "warn",
  });

  const passCount = items.filter((i) => i.status === "pass").length;
  const score = Math.round((passCount / items.length) * 100);
  const hasBlockingIssues = items.some((i) => i.status === "fail");

  return {
    items,
    score,
    hasBlockingIssues,
    suggestedTitle,
    suggestedDescription,
  };
}
