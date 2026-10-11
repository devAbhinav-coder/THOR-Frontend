import { formatPrice } from "@/lib/utils";
import { priceClassName } from "@/lib/storefrontTypography";

type PriceTextProps = {
  amount: number;
  className?: string;
};

export default function PriceText({ amount, className }: PriceTextProps) {
  return (
    <span className={priceClassName(className)}>{formatPrice(amount)}</span>
  );
}
