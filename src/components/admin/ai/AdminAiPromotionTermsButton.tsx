"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import type { PromotionType, PromoScopeType } from "@/types";

type Props = {
  name?: string;
  displayTitle?: string;
  description?: string;
  promotionType: PromotionType;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  discountValue?: string;
  minOrderAmount?: string;
  scopeType: PromoScopeType;
  onTerms: (text: string) => void;
};

export function AdminAiPromotionTermsButton({
  name,
  displayTitle,
  description,
  promotionType,
  buyQuantity,
  getQuantity,
  getDiscountPercent,
  discountValue,
  minOrderAmount,
  scopeType,
  onTerms,
}: Props) {
  const { status } = useAdminAiStatus();
  const [loading, setLoading] = useState(false);

  if (!status?.enabled) return null;

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='rounded-lg border-violet-200 bg-violet-50/40 text-violet-900 gap-1.5 shrink-0'
      disabled={loading}
      onClick={async () => {
        if (!displayTitle?.trim() && !name?.trim()) {
          toast.error("Pehle offer ka naam ya title bharo");
          return;
        }
        setLoading(true);
        try {
          const res = await adminAiApi.draftPromotionTerms({
            name: name?.trim() || undefined,
            displayTitle: displayTitle?.trim() || undefined,
            description: description?.trim() || undefined,
            promotionType,
            buyQuantity,
            getQuantity,
            getDiscountPercent,
            discountValue: discountValue ? Number(discountValue) : undefined,
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
            scopeType,
          });
          const d = res.data as { termsAndConditions?: string; text?: string };
          const terms = (d.termsAndConditions || d.text || "").trim();
          if (terms.length < 15) {
            throw new Error("AI ne khali T&C bheji — dubara try karo");
          }
          onTerms(terms);
          toast.success("AI ne simple T&C likh di — review karke save karo");
        } catch (e) {
          toast.error(aiErrorMessage(e));
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ?
        <Loader2 className='h-4 w-4 animate-spin' />
      : <Sparkles className='h-4 w-4' />}
      AI Generate T&amp;C
    </Button>
  );
}
