"use client";

import { countDetailParts } from "@/lib/productDetailsBulk";

type Props = {
  keysText: string;
  valuesText: string;
  onKeysChange: (v: string) => void;
  onValuesChange: (v: string) => void;
  textareaCls: string;
};

/**
 * Admin bulk entry for PDP “Product details” table: keys vs values (comma or newline).
 */
export default function ProductDetailsBulkFields({
  keysText,
  valuesText,
  onKeysChange,
  onValuesChange,
  textareaCls,
}: Props) {
  const nk = countDetailParts(keysText);
  const nv = countDetailParts(valuesText);
  const bothEmpty = nk === 0 && nv === 0;
  const match = nk === nv;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Enter the <strong>same number</strong> of keys and values. Use{" "}
        <strong>commas</strong> on one line (e.g.{" "}
        <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-gray-200">
          Fabric, Work, Length
        </code>
        ) or put <strong>one per line</strong> — line 1 key matches line 1 value.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Keys
          </label>
          <textarea
            className={textareaCls}
            rows={6}
            value={keysText}
            onChange={(e) => onKeysChange(e.target.value)}
            placeholder={
              "Fabric, Work type, Length\nor one key per line:\nFabric\nWork\nCare"
            }
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Values
          </label>
          <textarea
            className={textareaCls}
            rows={6}
            value={valuesText}
            onChange={(e) => onValuesChange(e.target.value)}
            placeholder={
              "Silk, Hand embroidery, 5.5m\nor one value per line:\nSilk\nZardozi\nDry clean"
            }
            spellCheck={false}
          />
        </div>
      </div>
      <p
        className={`text-xs font-medium ${bothEmpty ? "text-gray-400" : match ? "text-emerald-700" : "text-amber-800"}`}
        role="status"
      >
        {bothEmpty ?
          "Optional — leave empty if you don’t need a specs table on the product page."
        : match ?
          `${nk} detail row(s) — ready to save.`
        : `${nk} key(s) · ${nv} value(s) — counts must match before save.`}
      </p>
    </div>
  );
}
