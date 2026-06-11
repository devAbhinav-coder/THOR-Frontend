import type { BlogImageLayout } from "@/types";

/** Bento grid card patterns — cycles every 4 posts after the featured hero. */
export type GridCardVariant = "wide" | "portrait" | "square" | "horizontal";

export function gridVariantForIndex(index: number): GridCardVariant {
  const variants: GridCardVariant[] = ["wide", "portrait", "square", "horizontal"];
  return variants[index % variants.length];
}

export const BLOG_IMAGE_LAYOUTS: {
  value: BlogImageLayout;
  label: string;
  aspect: number | undefined;
  hint: string;
}[] = [
  { value: "hero", label: "Hero Banner", aspect: 16 / 9, hint: "Full-width feature image" },
  { value: "wide", label: "Wide (16:9)", aspect: 16 / 9, hint: "Listing wide card" },
  { value: "portrait", label: "Portrait (4:5)", aspect: 4 / 5, hint: "Tall editorial card" },
  { value: "square", label: "Square (1:1)", aspect: 1, hint: "Balanced grid tile" },
  { value: "inline", label: "Inline Article", aspect: 16 / 10, hint: "In-article figure" },
  { value: "split", label: "Split Row", aspect: 1, hint: "Side-by-side layout" },
];

export function defaultLayoutForIndex(index: number): BlogImageLayout {
  const defaults: BlogImageLayout[] = [
    "hero",
    "wide",
    "portrait",
    "square",
    "inline",
    "split",
  ];
  return defaults[index % defaults.length];
}

export function aspectForLayout(layout?: BlogImageLayout): number | undefined {
  return BLOG_IMAGE_LAYOUTS.find((l) => l.value === layout)?.aspect;
}

export function layoutLabel(layout: BlogImageLayout): string {
  return BLOG_IMAGE_LAYOUTS.find((l) => l.value === layout)?.label ?? layout;
}

export function gridColSpan(variant: GridCardVariant): string {
  switch (variant) {
    case "wide":
    case "horizontal":
      return "md:col-span-8";
    case "portrait":
    case "square":
      return "md:col-span-4";
    default:
      return "md:col-span-4";
  }
}

export function gridImageAspect(variant: GridCardVariant): string {
  switch (variant) {
    case "wide":
    case "horizontal":
      return "aspect-[16/9]";
    case "portrait":
      return "aspect-[4/5]";
    case "square":
      return "aspect-square";
    default:
      return "aspect-[4/5]";
  }
}

/** Prefer stored image layout for listing card crop when available. */
export function listingImageAspect(
  layout: BlogImageLayout | undefined,
  variant: GridCardVariant,
): string {
  switch (layout) {
    case "hero":
    case "wide":
      return "aspect-[16/9]";
    case "portrait":
      return "aspect-[4/5]";
    case "square":
    case "split":
      return "aspect-square";
    case "inline":
      return "aspect-[16/10]";
    default:
      return gridImageAspect(variant);
  }
}
