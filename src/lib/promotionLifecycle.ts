import type { Promotion } from '@/types';

export type PromotionLifecycle =
  | 'live'
  | 'scheduled'
  | 'expired'
  | 'inactive';

export function getPromotionLifecycle(
  promotion: Pick<Promotion, 'isActive' | 'startDate' | 'endDate'>,
  now = new Date(),
): PromotionLifecycle {
  if (!promotion.isActive) return 'inactive';
  const start = new Date(promotion.startDate);
  const end = new Date(promotion.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'inactive';
  }
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'live';
}

export function promotionShowsOnPdp(
  promotion: Pick<
    Promotion,
    'isActive' | 'startDate' | 'endDate' | 'showOnStorefront'
  >,
  now = new Date(),
): boolean {
  return (
    promotion.showOnStorefront !== false &&
    getPromotionLifecycle(promotion, now) === 'live'
  );
}
