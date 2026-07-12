/** Normalize free-text for intent matching — typos, spacing, casual shorthand */
export function normalizeForIntent(input: string): string {
  let q = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s#@.-]/g, " ")
    .replace(/\s+/g, " ");

  const replacements: [RegExp, string][] = [
    [/\b(helo|hlw|hii+|heyy+|hy+)\b/g, "hi"],
    [/\b(thnks|thnx|thanx|thanku|dhanyavaad|shukriya)\b/g, "thanks"],
    [/\b(plz|pls|plis|krdo|kardo)\b/g, "please"],
    [/\b(cancell?ation|cancell?|cancle|cncl|cancel karo|band karo)\b/g, "cancel"],
    [/\b(ordre?s?|odrer|ordeer|order)\b/g, "order"],
    [/\b(mera order|mere order|meri order)\b/g, "my order"],
    [/\b(delivry|delivary|delievery|delevery|dilevery|delivery)\b/g, "delivery"],
    [/\b(ship+ing|shippment|shipment|bhej|bhejna|bhejoge)\b/g, "shipping"],
    [/\b(track+ing|trakking|traking|kahan hai|kaha hai|kidhar)\b/g, "tracking"],
    [/\b(refnd|refundd|refun|paisa wapas|money back)\b/g, "refund"],
    [/\b(retrn|retrun|retun|wapas|wapisi)\b/g, "return"],
    [/\b(paymnt|payemnt|pyment|payment)\b/g, "payment"],
    [/\b(copon|coupan|cupon|promocode)\b/g, "coupon"],
    [/\b(suport|supprt|suppot|madad|sahayata)\b/g, "support"],
    [/\b(helpp+|halp|help chahiye)\b/g, "help"],
    [/\b(wher+is|wheris)\b/g, "where is"],
    [/\b(staus|statu?s|hal)\b/g, "status"],
    [/\b(exchnge|exchage|badalna)\b/g, "exchange"],
    [/\b(damagd|damged|kharab|tuta)\b/g, "damaged"],
    [/\b(namste|namaskar|namaste)\b/g, "namaste"],
    [/\b(kitne din|kab aayega|kab milega)\b/g, "how long"],
    [/\b(pincode|pin code|pin)\b/g, "pincode"],
    [/\b(size|naap|measurement|2xl|3xl|blouse)\b/g, "size"],
    [/\b(haan|han|ji|ha)\b/g, "yes"],
    [/\b(nahi|nah|na|mat)\b/g, "no"],
  ];

  for (const [re, word] of replacements) {
    q = q.replace(re, word);
  }

  return q.trim();
}

/** Loose match: keyword present or within 1 edit distance on a word */
export function fuzzyHas(text: string, keywords: string[]): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  for (const kw of keywords) {
    if (text.includes(kw)) return true;
    for (const w of words) {
      if (w.length >= 3 && kw.length >= 3 && levenshtein(w, kw) <= 1) return true;
    }
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cur =
        a[i - 1] === b[j - 1] ?
          row[j]
        : 1 + Math.min(row[j], row[j - 1], prev);
      row[j - 1] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}
