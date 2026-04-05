import { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import ShopLoading from "./loading";
import { getSiteUrl } from "@/lib/siteUrl";

const baseTitle = "Shop | The House of Rani";
const baseDesc =
  "Shop premium sarees, lehengas, and ethnic wear at The House of Rani. Filter by category, fabric, price, and rating to find your perfect look.";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildCanonicalPath(sp: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams();
  const set = (k: string) => {
    const v = sp[k];
    if (typeof v === "string" && v.trim()) q.set(k, v);
  };
  set("category");
  set("fabric");
  set("search");
  set("sort");
  set("minPrice");
  set("maxPrice");
  set("rating");
  set("isFeatured");
  const s = q.toString();
  return s ? (`/shop?${s}` as const) : "/shop";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const dec = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const cat = typeof sp.category === "string" ? dec(sp.category) : "";
  const fabric = typeof sp.fabric === "string" ? dec(sp.fabric) : "";
  const searchRaw = typeof sp.search === "string" ? dec(sp.search) : "";
  const search = searchRaw.slice(0, 48);
  const featured = sp.isFeatured === "true";

  let title = baseTitle;
  if (featured) title = `Featured Products | ${baseTitle}`;
  else if (cat) title = `${cat} | Shop | The House of Rani`;
  else if (fabric) title = `${fabric} | Shop | The House of Rani`;
  else if (search) title = `"${search}" | Search | The House of Rani`;

  let description = baseDesc;
  if (cat) {
    description = `Browse ${cat} at The House of Rani — premium ethnic wear with filters for fabric, price, and ratings.`;
  } else if (search) {
    description = `Search results for "${search}" — sarees, lehengas, and more at The House of Rani.`;
  } else if (featured) {
    description =
      "Handpicked featured sarees and ethnic wear at The House of Rani.";
  }

  const appUrl = getSiteUrl();
  const canonicalPath = buildCanonicalPath(sp);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${appUrl}${canonicalPath}`,
      type: "website",
      siteName: "The House of Rani",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopClient />
    </Suspense>
  );
}
