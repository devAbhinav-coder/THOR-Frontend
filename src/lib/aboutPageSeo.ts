import { BRAND_NAME } from "@/lib/brandSeo";
import { ABOUT_HERO_TITLE } from "@/lib/aboutStoryCopy";

/** Browser tab + root layout template appends brand suffix. */
export const ABOUT_METADATA_TITLE = `About Us - ${ABOUT_HERO_TITLE.replace(/!+$/, "")}`;

/** Meta description (~155 chars) - aligned with on-page queen story. */
export const ABOUT_META_DESCRIPTION = `The queen in every woman: ${BRAND_NAME} blends Indian heritage crafts with an easy modern drape. Founded by textile designer Priya Rani (NIIFT). Premium sarees & ethnic wear in India.`;

export const ABOUT_KEYWORDS = [
  "about The House of Rani",
  "The Queen in Every Woman",
  "House of Rani brand story",
  "Rani means queen",
  "Priya Rani founder",
  "NIIFT textile designer",
  "Indian heritage sarees",
  "folk tradition ethnic wear",
  "modern ethnic sarees India",
  "premium sarees online India",
  "salwar suits brand India",
  "handcrafted Indian sarees",
  "story-led saree designs",
  "Kalamkari sarees",
  "hand painted saree",
  "pure silk saree brand",
  "The Rani Premium Edit",
  "ethnic corsets India",
  "Indian ethnic wear brand",
] as const;

export const ABOUT_OG_IMAGE_ALT = `${ABOUT_HERO_TITLE} | ${BRAND_NAME} About`;

export const ABOUT_HERO_IMAGE_ALT = `${BRAND_NAME} - ${ABOUT_HERO_TITLE.replace(/!+$/, "")}, premium ethnic wear India`;

export const ABOUT_SCHEMA_HEADLINE = ABOUT_HERO_TITLE.replace(/!+$/, "");

export const ABOUT_ORGANIZATION_STORY = `${BRAND_NAME} celebrates the queen in every woman through story-led sarees and ethnic wear rooted in Indian art, folk traditions, and contemporary comfort.`;

export const ABOUT_FOUNDER_SCHEMA_DESCRIPTION =
  "Priya Rani trained as a textile designer at NIIFT and founded The House of Rani to bring India's regional crafts closer to today's woman.";

export const ABOUT_FOUNDER_KNOWS_ABOUT = [
  "Textile design",
  "Indian regional crafts",
  "Indian folk art traditions",
  "Kalamkari",
  "Ethnic wear",
  "Saree design",
  "Heritage craftsmanship",
] as const;

/** Short blurb for llms.txt / AI crawlers. */
export const ABOUT_LLMS_SUMMARY = `${BRAND_NAME} brand story ("The Queen in Every Woman"): heritage Indian crafts, modern drape, founder Priya Rani (NIIFT textile design). See ${BRAND_NAME} About page for the full story.`;
