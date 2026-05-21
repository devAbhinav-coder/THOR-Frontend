export const EXPENSE_CATEGORIES = [
  { id: 'shipping_outbound', label: 'Shipping (outbound)', hint: 'Delhivery, courier, return freight' },
  { id: 'packing', label: 'Packing & handling', hint: 'Boxes, poly, labour' },
  { id: 'ads', label: 'Ads & marketing', hint: 'Meta, Google, influencers' },
  { id: 'miscellaneous', label: 'Miscellaneous', hint: 'One-off shop expenses' },
  { id: 'rent', label: 'Rent / shop', hint: 'Godown or showroom' },
  { id: 'utilities', label: 'Utilities', hint: 'Electricity, internet' },
  { id: 'salaries', label: 'Salaries & labour', hint: 'Staff, karigar' },
  { id: 'other', label: 'Other', hint: 'Anything else' },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id'];

export function categoryLabel(id: string): string {
  return EXPENSE_CATEGORIES.find(c => c.id === id)?.label ?? id;
}

export function categoryColor(id: string): string {
  const map: Record<string, string> = {
    shipping_outbound: 'bg-blue-500',
    packing: 'bg-amber-500',
    ads: 'bg-purple-500',
    miscellaneous: 'bg-gray-500',
    rent: 'bg-rose-500',
    utilities: 'bg-cyan-500',
    salaries: 'bg-orange-500',
    other: 'bg-slate-500',
  };
  return map[id] ?? 'bg-gray-400';
}
