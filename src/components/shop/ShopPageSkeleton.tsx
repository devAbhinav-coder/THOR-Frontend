import { Skeleton } from "@/components/ui/SkeletonLoader";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";
import {
  SHOP_INITIAL_SKELETON_COUNT,
  SHOP_PRODUCT_GRID_CLASS,
} from "@/lib/shopLayout";

interface ShopProductsSkeletonProps {
  count?: number;
  showDesktopToolbar?: boolean;
}

/** Product grid shimmer only — header, filters, and category strips stay visible. */
export default function ShopProductsSkeleton({
  count = SHOP_INITIAL_SKELETON_COUNT,
  showDesktopToolbar = true,
}: ShopProductsSkeletonProps) {
  return (
    <>
      {showDesktopToolbar ?
        <div className="mb-6 flex flex-col gap-4">
          <div className="hidden items-center justify-between border-b border-gray-100 pb-4 lg:flex">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
      : null}
      <div className={SHOP_PRODUCT_GRID_CLASS}>
        {Array.from({ length: count }).map((_, i) => (
          <ShopCollectionCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
