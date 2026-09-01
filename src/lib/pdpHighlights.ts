import type { Product } from "@/types";

const BULLET_PREFIX = /^[-•*]\s*/;

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function linesFromText(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter((line) => line.length >= 12 && line.length <= 220);
}

/** PDP "Why You'll Love It" bullets — admin highlights first, then smart fallbacks. */
export function getPdpHighlights(product: Product): string[] {
  const fromAdmin = (product.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  if (fromAdmin.length > 0) return fromAdmin.slice(0, 6);

  const fromDescription = linesFromText(stripHtml(product.description || ""));
  if (fromDescription.length >= 2) return fromDescription.slice(0, 6);

  const fallback: string[] = [];
  if (product.fabric?.trim()) {
    fallback.push(`Premium ${product.fabric.trim()} — soft, breathable & skin-friendly`);
  }
  if (product.subcategory?.trim()) {
    fallback.push(`Curated ${product.subcategory.trim()} from The House of Rani`);
  } else if (product.category?.trim()) {
    fallback.push(`Handpicked ${product.category.trim()} for everyday elegance`);
  }
  if (product.occasions?.length) {
    fallback.push(
      `Perfect for ${product.occasions.slice(0, 3).join(", ")} occasions`,
    );
  }
  if (product.shortDescription?.trim()) {
    fallback.push(product.shortDescription.trim());
  }
  fallback.push("Easy 5-day returns · Secure checkout · Free shipping above ₹1,099");

  return fallback.filter(Boolean).slice(0, 6);
}
