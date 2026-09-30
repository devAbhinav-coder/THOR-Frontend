/**
 * Validates Meta catalog feed XML (run after deploy or against local dev).
 * Usage: node scripts/validate-meta-feed.mjs [feedUrl]
 */
const feedUrl =
  process.argv[2]?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") + "/api/feed" ||
  "http://localhost:3000/api/feed";

const REQUIRED_ITEM_TAGS = [
  "g:id",
  "g:item_group_id",
  "g:title",
  "g:description",
  "g:link",
  "g:image_link",
  "g:availability",
  "g:price",
  "g:brand",
  "g:condition",
];

function extractItems(xml) {
  return xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
}

function hasTag(itemXml, tag) {
  return itemXml.includes(`<${tag}>`);
}

async function main() {
  console.log(`Fetching ${feedUrl} …`);
  const res = await fetch(feedUrl, { headers: { Accept: "application/xml" } });
  if (!res.ok) {
    console.error(`FAIL: HTTP ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();
  if (!xml.includes("<rss") || !xml.includes("xmlns:g=")) {
    console.error("FAIL: Not a Google/Meta RSS feed");
    process.exit(1);
  }
  const items = extractItems(xml);
  if (!items.length) {
    console.error("FAIL: No <item> rows in feed");
    process.exit(1);
  }

  let sample = items[0];
  const missing = REQUIRED_ITEM_TAGS.filter((t) => !hasTag(sample, t));
  if (missing.length) {
    console.error(`FAIL: Sample item missing tags: ${missing.join(", ")}`);
    process.exit(1);
  }

  const idMatch = sample.match(/<g:id>([^<]+)<\/g:id>/);
  const linkMatch = sample.match(/<g:link>([^<]+)<\/g:link>/);
  const imageMatch = sample.match(/<g:image_link>([^<]+)<\/g:image_link>/);

  console.log("OK: Meta catalog feed");
  console.log(`  Items: ${items.length}`);
  console.log(`  Sample id: ${idMatch?.[1] ?? "?"}`);
  console.log(`  Sample link: ${linkMatch?.[1] ?? "?"}`);
  console.log(`  Sample image: ${imageMatch?.[1]?.slice(0, 72) ?? "?"}…`);
  console.log(`  Has atom self link: ${xml.includes("atom:link")}`);
  console.log(`  Has identifier_exists: ${sample.includes("g:identifier_exists")}`);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
