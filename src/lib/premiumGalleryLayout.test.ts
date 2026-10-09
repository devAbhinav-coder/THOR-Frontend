import assert from "node:assert/strict";
import { buildPremiumEditorialRows } from "./premiumGalleryLayout";

const fallbacks = {
  editorial: "https://example.com/ed.jpg",
  craft: "https://example.com/craft.jpg",
};

function runFourImageLayout(): void {
  const gallery = ["g0", "g1", "g2", "g3"];
  const rows = buildPremiumEditorialRows(gallery, fallbacks);
  const imagesShown = new Set<string>();
  for (const row of rows) {
    if (row.type === "feature") imagesShown.add(row.image);
    if (row.type === "pair") {
      imagesShown.add(row.left);
      imagesShown.add(row.right);
    }
    if (row.type === "single") imagesShown.add(row.image);
  }
  assert.equal(imagesShown.size, 4);
  assert.ok(rows.some((r) => r.type === "feature" && r.align === "start"));
  assert.ok(rows.some((r) => r.type === "feature" && r.align === "end"));
  assert.ok(rows.some((r) => r.type === "pair"));
}

runFourImageLayout();
console.log("premiumGalleryLayout.test.ts: ok");
