#!/usr/bin/env node
/**
 * Prints sha384 SRI hashes for third-party scripts. Use output to set env vars or update
 * `src/lib/thirdPartySri.ts` when vendors rotate files.
 *
 * Usage (from frontend/): node scripts/compute-third-party-sri.mjs
 */
import crypto from "node:crypto";
import https from "node:https";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SRI-hash-tool/1.0)" };

function sha384Sri(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: UA }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const hash = crypto.createHash("sha384").update(buf).digest("base64");
          resolve({
            url,
            status: res.statusCode,
            bytes: buf.length,
            integrity: `sha384-${hash}`,
          });
        });
      })
      .on("error", reject);
  });
}

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-563PKNCB4J";

const urls = [
  "https://checkout.razorpay.com/v1/checkout.js",
  "https://connect.facebook.net/en_US/fbevents.js",
  `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`,
];

async function main() {
  console.error("# third-party SRI (sha384)\n");
  for (const url of urls) {
    try {
      const r = await sha384Sri(url);
      console.log(JSON.stringify(r, null, 2));
      console.log("");
    } catch (e) {
      console.error(url, e.message);
    }
  }
  console.error(
    "Set NEXT_PUBLIC_GTAG_JS_INTEGRITY / NEXT_PUBLIC_FB_EVENTS_JS_INTEGRITY in production as needed.",
  );
}

main();
