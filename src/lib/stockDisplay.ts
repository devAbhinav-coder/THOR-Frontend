export type StockDisplayTone = "out" | "in";

export function getVariantStockDisplay(stock: number): {
  label: string;
  tone: StockDisplayTone;
} {
  const units = Math.max(0, Math.floor(Number(stock) || 0));
  if (units === 0) {
    return { label: "Out of stock", tone: "out" };
  }
  return { label: "In stock", tone: "in" };
}
