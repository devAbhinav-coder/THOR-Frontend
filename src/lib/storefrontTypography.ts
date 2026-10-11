import { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";

/** Product titles on PDP, cart, checkout — body sans, not display serif. */
export function productNameClassName(...extra: ClassValue[]) {
  return cn(
    "font-sans font-semibold tracking-tight text-navy-900 leading-snug",
    extra,
  );
}

/** Rupee amounts — always sans + tabular nums so ₹ and digits stay aligned. */
export function priceClassName(...extra: ClassValue[]) {
  return cn("font-sans tabular-nums tracking-normal text-navy-900", extra);
}
