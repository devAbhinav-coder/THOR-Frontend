'use client';

import { ArrowRight, Copy } from 'lucide-react';
import {
  DEFAULT_VISIT_POPUP_TEXT_COLOR,
  resolveVisitPopupTextColor,
  resolveVisitPopupTextStyle,
  visitPopupOverlayText,
  visitPopupTextStyle,
  visitPopupTypography,
  VISIT_POPUP_TEXT_STYLES,
  type VisitPopupTextStyleId,
} from '@/lib/visitPopupOverlay';
import { cn } from '@/lib/utils';

type Props = {
  imageUrl?: string | null;
  description?: string;
  visitPopupOverlayText?: string;
  visitPopupTextColor?: string;
  visitPopupTextStyle?: VisitPopupTextStyleId | string | null;
  ctaLabel: string;
  showCouponCode?: string;
  className?: string;
};

/** Live preview of storefront visit popup overlay (3:4). */
export default function AdminVisitPopupPreview({
  imageUrl,
  description,
  visitPopupOverlayText: overlayRaw,
  visitPopupTextColor,
  visitPopupTextStyle: textStyleRaw,
  ctaLabel,
  showCouponCode,
  className,
}: Props) {
  const textColor = resolveVisitPopupTextColor(visitPopupTextColor);
  const styleId = resolveVisitPopupTextStyle(textStyleRaw);
  const typo = visitPopupTypography(styleId);
  const overlayLine = visitPopupOverlayText(overlayRaw);
  const desc = (description || '').trim();
  const styleLabel =
    VISIT_POPUP_TEXT_STYLES.find((s) => s.id === styleId)?.label ?? styleId;

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-gray-200 bg-navy-950 shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[3/4] w-full">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-brand-800 to-navy-800" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          {overlayLine ? (
            <p
              className={cn('mb-1.5 leading-snug', typo.overlayClass)}
              style={visitPopupTextStyle(styleId, textColor)}
            >
              {overlayLine}
            </p>
          ) : null}
          {desc ? (
            <p
              className={cn('mb-2 line-clamp-3', typo.bodyClass)}
              style={visitPopupTextStyle(styleId, textColor, 0.92)}
            >
              {desc}
            </p>
          ) : null}
          {showCouponCode ? (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-white/20 bg-black/25 px-2.5 py-2 backdrop-blur-sm">
              <span className={typo.codeClass} style={visitPopupTextStyle(styleId, textColor)}>
                {showCouponCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-[8px] font-bold uppercase text-white">
                <Copy className="h-2.5 w-2.5" /> Copy
              </span>
            </div>
          ) : (
            <div className="mb-2 flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-white">
              {ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-gray-100 bg-gray-50 px-2 py-2 text-center text-[10px] leading-relaxed text-gray-500">
        Storefront preview ·{' '}
        <span className="font-medium text-gray-700">{styleLabel}</span>
        {' · '}
        <span className="font-mono">{textColor || DEFAULT_VISIT_POPUP_TEXT_COLOR}</span>
      </p>
    </div>
  );
}
