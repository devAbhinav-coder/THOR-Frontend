/**
 * Must match `backend/src/constants/inventory.ts`.
 * Alert / badge when stock is below this number (not including this number).
 */
export const LOW_STOCK_ALERT_EXCLUSIVE_MAX = 3;

/** In-stock SKU: show “few left” style messaging when below threshold. */
export function isLowInStockVariant(stock: number): boolean {
  return stock > 0 && stock < LOW_STOCK_ALERT_EXCLUSIVE_MAX;
}

/** Admin list: total units across variants — warn below threshold (excluding 0 = use out-of-stock styling). */
export function isLowInventoryTotal(total: number): boolean {
  return total > 0 && total < LOW_STOCK_ALERT_EXCLUSIVE_MAX;
}
