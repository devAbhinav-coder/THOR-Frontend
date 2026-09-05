export type PremiumEditorialPanel = {
  /** Optional heading beside the editorial image */
  title?: string;
  fields: Array<{ label: string; value: string }>;
  note: string;
};

export type PremiumProduct = {
  slug: string;
  name: string;
  subtitle: string;
  fabric: string;
  price: number;
  heroImage: string;
  images: string[];
  description: string;
  craftNote: string;
  weaveHours: number;
  /** Text beside the first editorial image row */
  editorialOpen: PremiumEditorialPanel;
  /** Text beside the last editorial image row */
  editorialClose: PremiumEditorialPanel;
};

export const PREMIUM_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuofU8c6wRF8VBfwG8U28qE8w2Al1uu9dLi_aXxNV76wGx8yD26CWuEPa3irYKEnIkyBF3RahoLHNInbp-QxhVEoJfFNEvzGZtsupkdksMwpwEKy0uXFVV1USwS2buZLH7UHbo8RhMZmqi_l2oAUP2K3lHVUq-uaVjhA7-OhsXFysQkX402LAxuKKUyLNsfvQjTR1LN8kfabWi35TEiReKKjtCTama74kl4epz8Vl8n-ak7zuas27Y";

export const PREMIUM_EDITORIAL_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASf43yZ3BDmuYDDMeSzbJAV0CoLlSV8aw24sXZGBnin-zWr17TsoyOVTA_RjhbcDzje8FSoHMsRnme3lXtNLlOQKuirthV6Q7XzgB-undM1Cd_IAvINzUL7dCyhfxSrNfSNGGOwv8-E7tGyt7UB5FBIRB-QQ2nuL1le6rrFOtWmqoAiGFvGvm0yM2QaXH_D4AzAgMmRrn9Ug59lSmY7JVhWZOyinPW2EkMDVnqYiogcy2bb7RoY_lr";

export const PREMIUM_CRAFT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCO5Xn5ylpFhdchh0dGvBeo_2DbF1I07grST8K9atGxmoJJKpDrB6sv4Q-iYBmpDSmDOLS1fp6VBjL4EdJRhavlDQXXNwmxEe435fVcalqwr1dKhw67oCq32NGmtClRL3QM2WSA5m46sCOlDoP10d6oD08aaDvaERJSi-0PuXzcgVYtQPkT_j1XwwU-tXsfFXdrlFa0pvTlF6hyT1INMOzZQLcn8v5IejY0yMlMO46pSN1kLTsVHT-9";

export const PREMIUM_PRODUCTS: PremiumProduct[] = [
  {
    slug: "rani-silk-rose-gold",
    name: "RANI SILK — ROSE GOLD",
    subtitle: "Handwoven Silk",
    fabric: "Handwoven Silk",
    price: 99999,
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYeVIp4KitMBNq07_Vg1UnFdutY__ehX9l7PJkXS5CsImQ2XRLY4fVh6M_KKuFqAQHHqdiSuqJuxO7US6R6mUHnu3tNWRLWpKhObt30r46FhJu3mg85LRRPGrj4v684tUmI8oe9e2Q6I26Wh-UY3usuT_SChQKNxR9a0EN7D_7hbOVZLBFX0n4KN1SeZoVGiNHOuKAK0mu4XSpFJAg04WjgYhyn-bfb448rZVD_gGl8uvQRrIxXgeQ",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYeVIp4KitMBNq07_Vg1UnFdutY__ehX9l7PJkXS5CsImQ2XRLY4fVh6M_KKuFqAQHHqdiSuqJuxO7US6R6mUHnu3tNWRLWpKhObt30r46FhJu3mg85LRRPGrj4v684tUmI8oe9e2Q6I26Wh-UY3usuT_SChQKNxR9a0EN7D_7hbOVZLBFX0n4KN1SeZoVGiNHOuKAK0mu4XSpFJAg04WjgYhyn-bfb448rZVD_gGl8uvQRrIxXgeQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASf43yZ3BDmuYDDMeSzbJAV0CoLlSV8aw24sXZGBnin-zWr17TsoyOVTA_RjhbcDzje8FSoHMsRnme3lXtNLlOQKuirthV6Q7XzgB-undM1Cd_IAvINzUL7dCyhfxSrNfSNGGOwv8-E7tGyt7UB5FBIRB-QQ2nuL1le6rrFOtWmqoAiGFvGvm0yM2QaXH_D4AzAgMmRrn9Ug59lSmY7JVhWZOyinPW2EkMDVnqYiogcy2bb7RoY_lr",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCO5Xn5ylpFhdchh0dGvBeo_2DbF1I07grST8K9atGxmoJJKpDrB6sv4Q-iYBmpDSmDOLS1fp6VBjL4EdJRhavlDQXXNwmxEe435fVcalqwr1dKhw67oCq32NGmtClRL3QM2WSA5m46sCOlDoP10d6oD08aaDvaERJSi-0PuXzcgVYtQPkT_j1XwwU-tXsfFXdrlFa0pvTlF6hyT1INMOzZQLcn8v5IejY0yMlMO46pSN1kLTsVHT-9",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuofU8c6wRF8VBfwG8U28qE8w2Al1uu9dLi_aXxNV76wGx8yD26CWuEPa3irYKEnIkyBF3RahoLHNInbp-QxhVEoJfFNEvzGZtsupkdksMwpwEKy0uXFVV1USwS2buZLH7UHbo8RhMZmqi_l2oAUP2K3lHVUq-uaVjhA7-OhsXFysQkX402LAxuKKUyLNsfvQjTR1LN8kfabWi35TEiReKKjtCTama74kl4epz8Vl8n-ak7zuas27Y",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
    ],
    description:
      "A luminous handwoven silk saree in metallic rose gold, finished with pale champagne zari borders. Woven for evening celebrations and heirloom dressing.",
    craftNote:
      "Each pallu is finished by hand over 200 hours of loom work, preserving the subtle irregularities that mark true artisanal silk.",
    weaveHours: 210,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Handwoven mulberry silk" },
        { label: "Tone", value: "Metallic rose gold with champagne zari" },
      ],
      note: "Woven for evening light — the silk catches candlelight and movement with a soft, luminous sheen across the body.",
    },
    editorialClose: {
      title: "The pallu",
      fields: [
        { label: "Pallu", value: "Weighted hand-finished fall" },
        { label: "Finish", value: "Champagne zari borders" },
      ],
      note: "The pallu is weighted for an effortless fall — made to be passed down, not merely worn once.",
    },
  },
  {
    slug: "nocturne-silver-wrap",
    name: "NOCTURNE SILVER WRAP",
    subtitle: "Banarasi Brocade",
    fabric: "Banarasi Brocade",
    price: 154999,
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7Q1fhebW6mQNrBAboyNukvKQGe9g0zQ3z5Vh-UASckVO_j0pjMMjBGSR08za_sxSrXk6E3wQjy-d-LxiA8EPWNDOA5N_VuJD3hYsMBzsiEdAlxi8_XJyf9fAXjVxoPSnfcqVdtR8rJF1fnGloDZE3WGnhi3Mk4U4rV0U5l8qzpburKq-APtV131sJYMQBCZfU1Ucy_R61aK6DSxiet6B-FSbDZPC7YguM0ejL54x-Rek4xGXxfk1R",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7Q1fhebW6mQNrBAboyNukvKQGe9g0zQ3z5Vh-UASckVO_j0pjMMjBGSR08za_sxSrXk6E3wQjy-d-LxiA8EPWNDOA5N_VuJD3hYsMBzsiEdAlxi8_XJyf9fAXjVxoPSnfcqVdtR8rJF1fnGloDZE3WGnhi3Mk4U4rV0U5l8qzpburKq-APtV131sJYMQBCZfU1Ucy_R61aK6DSxiet6B-FSbDZPC7YguM0ejL54x-Rek4xGXxfk1R",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCO5Xn5ylpFhdchh0dGvBeo_2DbF1I07grST8K9atGxmoJJKpDrB6sv4Q-iYBmpDSmDOLS1fp6VBjL4EdJRhavlDQXXNwmxEe435fVcalqwr1dKhw67oCq32NGmtClRL3QM2WSA5m46sCOlDoP10d6oD08aaDvaERJSi-0PuXzcgVYtQPkT_j1XwwU-tXsfFXdrlFa0pvTlF6hyT1INMOzZQLcn8v5IejY0yMlMO46pSN1kLTsVHT-9",
    ],
    description:
      "Deep midnight blue silk with antique silver brocade — austere, modern, and unmistakably regal. A statement drape for the discerning wardrobe.",
    craftNote:
      "Banarasi brocade motifs are lifted thread by thread on traditional jacquard looms in Varanasi.",
    weaveHours: 240,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Deep midnight silk base" },
        { label: "Technique", value: "Antique silver brocade weave" },
      ],
      note: "Austere and architectural — the brocade reads as sculpture in motion, built for rooms lit low and occasions that demand quiet authority.",
    },
    editorialClose: {
      title: "The brocade",
      fields: [
        { label: "Motif", value: "Antique silver brocade" },
        { label: "Loom", value: "Traditional jacquard" },
      ],
      note: "Each motif is lifted thread by thread — the hallmark of true Banarasi brocade, never printed, never rushed.",
    },
  },
  {
    slug: "ivory-organza-mist",
    name: "IVORY ORGANZA MIST",
    subtitle: "Pure Organza Silk",
    fabric: "Pure Organza Silk",
    price: 78999,
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzsbbt8Ilx_n9DiPqBfaf7Prbhi4GjRB4P9rl1dEBKUeHk2QI3hcg3c4D7BWWzXibry-CZhf8szBACNWZEhQHcvIgXLKkc6sL-VT7E3waGJkUmkOrEtVwsqTlfRA-ibXEzcwkVdbJx2Dv1VjodP6HKUrPIHcpI2ypejY8IZFRlGzCWHr6oSLC05y-6e2GHXzeMAxfgnirb6SicfEezWjCWV6matl74tXZFAwy7DHmg7IrPAQwUZhcV",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzsbbt8Ilx_n9DiPqBfaf7Prbhi4GjRB4P9rl1dEBKUeHk2QI3hcg3c4D7BWWzXibry-CZhf8szBACNWZEhQHcvIgXLKkc6sL-VT7E3waGJkUmkOrEtVwsqTlfRA-ibXEzcwkVdbJx2Dv1VjodP6HKUrPIHcpI2ypejY8IZFRlGzCWHr6oSLC05y-6e2GHXzeMAxfgnirb6SicfEezWjCWV6matl74tXZFAwy7DHmg7IrPAQwUZhcV",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuofU8c6wRF8VBfwG8U28qE8w2Al1uu9dLi_aXxNV76wGx8yD26CWuEPa3irYKEnIkyBF3RahoLHNInbp-QxhVEoJfFNEvzGZtsupkdksMwpwEKy0uXFVV1USwS2buZLH7UHbo8RhMZmqi_l2oAUP2K3lHVUq-uaVjhA7-OhsXFysQkX402LAxuKKUyLNsfvQjTR1LN8kfabWi35TEiReKKjtCTama74kl4epz8Vl8n-ak7zuas27Y",
    ],
    description:
      "Sheer ivory organza with real silver and pale gold floral zari embroidery — ethereal, textural, and impossibly light on the body.",
    craftNote:
      "Organza is woven from the finest mulberry silk filaments, then hand-embroidered over weeks of atelier work.",
    weaveHours: 180,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Pure organza silk" },
        { label: "Embroidery", value: "Real silver and pale gold zari" },
      ],
      note: "Sheer and weightless — organza floats on the body, revealing layered light and movement with every step.",
    },
    editorialClose: {
      title: "The embroidery",
      fields: [
        { label: "Thread", value: "Real silver and pale gold zari" },
        { label: "Weight", value: "Sheer organza base" },
      ],
      note: "Weeks of atelier embroidery turn transparency into texture — ethereal from afar, intricate up close.",
    },
  },
  {
    slug: "emerald-archive",
    name: "EMERALD ARCHIVE",
    subtitle: "Heritage Kanjeevaram",
    fabric: "Heritage Kanjeevaram",
    price: 199999,
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD5FljGEeFHhd7RTSKCdSZTd7uF848bSfXuBQ0odXqYJnGh2m03h64k6OCTi4f9qYKKJxNEIyz96A9wci1hz3D2PPEAMlBhPfHhbS5xaQ8llA5yxgueDd94kTH3yx31ALa7yzpnyvu5xpMZTE1c5q-iBbAPTfg-xnY95-vjozBGx35YEaddVtXPTwL3xwHATswPrmscdhvhNY0Bq_nlEALjFsPEZ3qw_rwZW_CSQxMWFAXRPF2Zpzzg",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD5FljGEeFHhd7RTSKCdSZTd7uF848bSfXuBQ0odXqYJnGh2m03h64k6OCTi4f9qYKKJxNEIyz96A9wci1hz3D2PPEAMlBhPfHhbS5xaQ8llA5yxgueDd94kTH3yx31ALa7yzpnyvu5xpMZTE1c5q-iBbAPTfg-xnY95-vjozBGx35YEaddVtXPTwL3xwHATswPrmscdhvhNY0Bq_nlEALjFsPEZ3qw_rwZW_CSQxMWFAXRPF2Zpzzg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASf43yZ3BDmuYDDMeSzbJAV0CoLlSV8aw24sXZGBnin-zWr17TsoyOVTA_RjhbcDzje8FSoHMsRnme3lXtNLlOQKuirthV6Q7XzgB-undM1Cd_IAvINzUL7dCyhfxSrNfSNGGOwv8-E7tGyt7UB5FBIRB-QQ2nuL1le6rrFOtWmqoAiGFvGvm0yM2QaXH_D4AzAgMmRrn9Ug59lSmY7JVhWZOyinPW2EkMDVnqYiogcy2bb7RoY_lr",
    ],
    description:
      "A saturated emerald Kanjeevaram with heavy gold borders — contemporary luxury rooted in South Indian weaving tradition.",
    craftNote:
      "Temple-border Kanjeevaram silks are among the most labour-intensive weaves in the Rani atelier.",
    weaveHours: 260,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Heritage Kanjeevaram silk" },
        { label: "Colour", value: "Saturated emerald with gold contrast" },
      ],
      note: "South Indian temple-border tradition meets contemporary proportion — bold colour, heavier fall, unmistakable presence.",
    },
    editorialClose: {
      title: "The border",
      fields: [
        { label: "Border", value: "Heavy temple gold contrast" },
        { label: "Weight", value: "Heritage Kanjeevaram fall" },
      ],
      note: "Among the most labour-intensive weaves in the atelier — woven to anchor a wardrobe for decades.",
    },
  },
  {
    slug: "champagne-tissue-glow",
    name: "CHAMPAGNE TISSUE GLOW",
    subtitle: "Pure Tissue Silk",
    fabric: "Pure Tissue Silk",
    price: 84999,
    heroImage:
      "https://images.unsplash.com/photo-1748215541172-52e2a7692296?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    images: [
      "https://images.unsplash.com/photo-1748215541172-52e2a7692296?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://media.istockphoto.com/id/934307016/photo/tulle-is-a-delicate-tannin-that-is-used-for-dresses-or-other-creations-adds-a-lot-of-space-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=rs4S3RefYwOVCW_WokLu5RKwUkM0Bykad-N29-oUd5Y=",
    ],
    description:
      "Lustrous champagne tissue silk with a delicate metallic sheen and graceful drape — understated, luminous, and crafted for timeless celebrations.",
    craftNote:
      "Fine silk threads are woven with subtle metallic accents to create a soft, luminous finish with an elegant fall.",
    weaveHours: 210,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Pure tissue silk" },
        { label: "Sheen", value: "Champagne metallic lustre" },
      ],
      note: "Understated luminosity — tissue silk holds light without glare, ideal for daytime celebrations and quiet grandeur.",
    },
    editorialClose: {
      title: "The drape",
      fields: [
        { label: "Drape", value: "Graceful tissue fall" },
        { label: "Lustre", value: "Champagne metallic sheen" },
      ],
      note: "Metallic threads are woven into the silk itself — the glow is intrinsic, not applied.",
    },
  },
  {
    slug: "rose-gold-tissue-dream",
    name: "ROSE GOLD TISSUE DREAM",
    subtitle: "Pure Tissue Silk",
    fabric: "Pure Tissue Silk",
    price: 84999,
    heroImage:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
    ],
    description:
      "A luminous rose-gold tissue silk saree enriched with delicate floral zari detailing — refined, radiant, and designed for grand occasions.",
    craftNote:
      "Woven with fine silk and metallic zari threads, each motif is carefully finished by skilled artisans.",
    weaveHours: 210,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Rose-gold tissue silk" },
        { label: "Detail", value: "Delicate floral zari motifs" },
      ],
      note: "Radiant without excess — rose-gold tissue catches warm light and reads refined under evening chandeliers.",
    },
    editorialClose: {
      title: "The motif",
      fields: [
        { label: "Motif", value: "Delicate floral zari" },
        { label: "Finish", value: "Rose-gold tissue base" },
      ],
      note: "Each motif is finished by skilled artisans — designed for occasions that call for quiet, unmistakable luxury.",
    },
  },
  {
    slug: "midnight-kashmiri-silk",
    name: "MIDNIGHT KASHMIRI SILK",
    subtitle: "Pure Kashmiri Silk",
    fabric: "Pure Kashmiri Silk",
    price: 92999,
    heroImage:
      "https://images.unsplash.com/photo-1602713876960-09cc90c9869d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzJ8fEtBU0hNSVJJJTIwU0FSRUV8ZW58MHx8MHx8fDA%3D",
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
    ],
    description:
      "Deep midnight silk adorned with intricate Kashmiri-inspired floral embroidery — rich in texture, dramatic in character, and timeless in appeal.",
    craftNote:
      "The silk base is finished with intricate hand embroidery inspired by traditional Kashmiri floral artistry.",
    weaveHours: 240,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Pure Kashmiri silk" },
        { label: "Palette", value: "Deep midnight with floral contrast" },
      ],
      note: "Dramatic and textural — midnight silk grounds the embroidery so florals read vivid against a dark field.",
    },
    editorialClose: {
      title: "The embroidery",
      fields: [
        { label: "Embroidery", value: "Kashmiri-inspired florals" },
        { label: "Palette", value: "Midnight silk field" },
      ],
      note: "Inspired by traditional Kashmiri floral artistry — each stitch builds depth, never flat, never mechanical.",
    },
  },
  {
    slug: "antique-gold-kanjeevaram",
    name: "ANTIQUE GOLD KANJEEVARAM",
    subtitle: "Pure Kanjeevaram Silk",
    fabric: "Pure Kanjeevaram Silk",
    price: 109999,
    heroImage:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=85",
    ],
    description:
      "A regal Kanjeevaram silk woven with antique gold zari accents and traditional temple-inspired motifs — opulent, graceful, and heirloom-worthy.",
    craftNote:
      "Traditionally woven silk enriched with high-quality zari work, crafted to become a timeless heirloom piece.",
    weaveHours: 280,
    editorialOpen: {
      fields: [
        { label: "Body", value: "Pure Kanjeevaram silk" },
        { label: "Zari", value: "Antique gold temple motifs" },
      ],
      note: "Regal from the first fold — Kanjeevaram weight and antique gold zari signal heritage before a word is spoken.",
    },
    editorialClose: {
      title: "The heirloom",
      fields: [
        { label: "Zari", value: "Antique gold temple motifs" },
        { label: "Legacy", value: "Generational heirloom weave" },
      ],
      note: "Crafted to become a timeless heirloom — woven once, treasured across generations.",
    },
  },
];

export function getPremiumProductBySlug(
  slug: string,
): PremiumProduct | undefined {
  return PREMIUM_PRODUCTS.find((p) => p.slug === slug);
}

export const PREMIUM_COLLECTION_HREF = "/premium";

export const PREMIUM_COLLECTION_CARD = {
  id: "premium-collection",
  name: "Premium",
  subtitle: "THE EDIT",
  href: PREMIUM_COLLECTION_HREF,
  image: PREMIUM_HERO_IMAGE,
} as const;
