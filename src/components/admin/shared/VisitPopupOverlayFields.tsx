'use client';

import { Input } from '@/components/ui/input';
import {
  DEFAULT_VISIT_POPUP_TEXT_COLOR,
  isVisitPopupTextColor,
  resolveVisitPopupTextStyle,
  VISIT_POPUP_TEXT_STYLES,
  type VisitPopupTextStyleId,
} from '@/lib/visitPopupOverlay';
import {
  AdminOfferField,
  AdminOfferSelect,
} from '@/components/admin/shared/AdminOfferFormUi';
import AdminVisitPopupPreview from './AdminVisitPopupPreview';

type Props = {
  overlayText: string;
  textColor: string;
  textStyle: string;
  onOverlayTextChange: (value: string) => void;
  onTextColorChange: (value: string) => void;
  onTextStyleChange: (value: VisitPopupTextStyleId) => void;
  description?: string;
  imageUrl?: string | null;
  ctaLabel: string;
  showCouponCode?: string;
};

export default function VisitPopupOverlayFields({
  overlayText,
  textColor,
  textStyle,
  onOverlayTextChange,
  onTextColorChange,
  onTextStyleChange,
  description,
  imageUrl,
  ctaLabel,
  showCouponCode,
}: Props) {
  const pickerValue =
    isVisitPopupTextColor(textColor) ? textColor : DEFAULT_VISIT_POPUP_TEXT_COLOR;
  const styleId = resolveVisitPopupTextStyle(textStyle);
  const styleMeta = VISIT_POPUP_TEXT_STYLES.find((s) => s.id === styleId);

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-brand-200/80 bg-brand-50/30 p-4">
      <div>
        <p className="text-sm font-semibold text-navy-900">Visit popup overlay</p>
        <p className="mt-0.5 text-xs text-gray-600">
          Text, color &amp; font style on the 3:4 banner — live preview updates as you edit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="space-y-3">
          <Input
            label="Overlay line"
            value={overlayText}
            onChange={(e) => onOverlayTextChange(e.target.value)}
            placeholder="e.g. Limited stock · Auto-applies at checkout"
            hint="Short line above description. Leave blank to hide."
          />

          <AdminOfferField label="Font style">
            <AdminOfferSelect
              value={styleId}
              onChange={(e) =>
                onTextStyleChange(e.target.value as VisitPopupTextStyleId)
              }
            >
              {VISIT_POPUP_TEXT_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </AdminOfferSelect>
            {styleMeta ? (
              <p className="mt-1.5 text-[11px] text-gray-500">{styleMeta.hint}</p>
            ) : null}
          </AdminOfferField>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Text color
              </label>
              <input
                type="color"
                value={pickerValue}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                aria-label="Pick overlay text color"
              />
            </div>
            <div className="min-w-[120px] flex-1">
              <Input
                label="Hex"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
                placeholder={DEFAULT_VISIT_POPUP_TEXT_COLOR}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <AdminVisitPopupPreview
          className="lg:sticky lg:top-4"
          imageUrl={imageUrl}
          description={description}
          visitPopupOverlayText={overlayText}
          visitPopupTextColor={textColor}
          visitPopupTextStyle={styleId}
          ctaLabel={ctaLabel}
          showCouponCode={showCouponCode}
        />
      </div>
    </div>
  );
}
