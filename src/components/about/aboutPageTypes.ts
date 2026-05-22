export type AboutImage = {
  src: string;
  alt: string;
  caption?: string;
};

/** Product or shop-linked image on the About page */
export type AboutVisualImage = AboutImage & {
  href?: string;
};

export type AboutPageVisuals = {
  /** Top hero background only — not reused in gallery */
  hero: AboutImage | null;
  dreamBanner: AboutVisualImage | null;
  /** “Woven in detail” — hero slides + featured (product tiles link to PDP) */
  bento: AboutVisualImage[];
  /** Chapter 03 — featured saree (not hero slide 3) */
  intention: AboutVisualImage | null;
  /** Instagram block — featured saree (not hero slide 4) */
  connect: AboutVisualImage | null;
};

export type AboutProductTeaser = {
  slug: string;
  name: string;
  image: string;
  href: string;
};

export type AboutInternalLink = {
  href: string;
  label: string;
  description: string;
  group: "shop" | "discover" | "help" | "brand";
};
