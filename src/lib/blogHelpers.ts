import { plainBlogExcerpt } from "@/lib/blogServer";

export const BLOG_CATEGORIES = [
  { value: "saree-styling", label: "Saree Styling" },
  { value: "bridal", label: "Bridal" },
  { value: "gifting", label: "Gifting" },
  { value: "fabric-care", label: "Fabric Care" },
  { value: "festive", label: "Festive" },
  { value: "trends", label: "Trends" },
] as const;

export function blogExcerpt(
  excerpt: string | undefined,
  content: string,
  max = 200,
): string {
  return (excerpt || "").trim() || plainBlogExcerpt(content, max);
}

export function formatReadingTime(min?: number): string {
  const m = Math.max(1, min || 1);
  return `${m} min read`;
}

export function categoryLabel(value?: string): string {
  return BLOG_CATEGORIES.find((c) => c.value === value)?.label || "Journal";
}

export type SeoScore = { score: number; tips: string[] };

export function computeSeoScore(input: {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  excerpt?: string;
  content?: string;
}): SeoScore {
  let score = 0;
  const tips: string[] = [];
  const titleLen = (input.seoTitle || "").trim().length;
  const descLen = (input.seoDescription || "").trim().length;
  const kw = input.keywords?.filter(Boolean).length || 0;
  const words = (input.content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  if (titleLen >= 45 && titleLen <= 65) score += 25;
  else tips.push("SEO title 45–65 characters rakho");

  if (descLen >= 130 && descLen <= 165) score += 25;
  else tips.push("Meta description 130–165 characters rakho");

  if (kw >= 5) score += 20;
  else tips.push("Kam se kam 5 keywords add karo");

  if ((input.excerpt || "").length >= 120) score += 15;
  else tips.push("Excerpt 120+ characters likho");

  if (words >= 600) score += 15;
  else tips.push("Content 600+ words SEO ke liye better hai");

  return { score: Math.min(100, score), tips };
}
