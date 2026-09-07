import { useQuery } from '@tanstack/react-query';
import { couponApi } from '@/lib/api';
import { Coupon, type NearEligibleCoupon } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export type EligibleCouponLine = {
  productId: string;
  price: number;
  quantity: number;
};

export function eligibleCouponsQueryKey(
  subtotal: number,
  itemsKey: string,
) {
  return ['eligible-coupons', subtotal, itemsKey] as const;
}

/**
 * Shared eligible + near-eligible coupons for cart / checkout / PDP ticker.
 */
export function useEligibleCouponsQuery(
  subtotal: number | undefined,
  itemsKey: string,
  enabled = true,
  lines?: EligibleCouponLine[],
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const canRun =
    enabled &&
    isAuthenticated &&
    typeof subtotal === 'number' &&
    subtotal >= 0 &&
    (itemsKey.length > 0 || (lines?.length ?? 0) > 0);

  return useQuery({
    queryKey: eligibleCouponsQueryKey(subtotal ?? 0, itemsKey),
    queryFn: async () => {
      const res = await couponApi.getEligible(subtotal!, lines);
      const coupons: Coupon[] = res.data.coupons || [];
      const nearEligible: NearEligibleCoupon[] = (res.data.nearEligible ?? []).flatMap(
        (entry) =>
          entry.coupon ?
            [{ coupon: entry.coupon as Coupon, hintMessage: entry.hintMessage }]
          : [],
      );
      return { coupons, nearEligible };
    },
    enabled: canRun,
    staleTime: 1000 * 45,
  });
}
