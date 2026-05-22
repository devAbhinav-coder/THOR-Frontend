export type AboutImage = {
  src: string;
  alt: string;
  caption?: string;
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
