"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Product } from "@/types";

type Props = {
  product: Pick<Product, "_id" | "customFields">;
  answers: Record<string, string>;
  onChange: (label: string, value: string) => void;
  uploadingFieldImages: Record<string, boolean>;
  onImageUpload: (fieldLabel: string, file?: File) => void;
  /** Premium PDP uses a lighter surface; shop uses gold tint. */
  variant?: "shop" | "premium";
};

export function PdpInlineCustomFields({
  product,
  answers,
  onChange,
  uploadingFieldImages,
  onImageUpload,
  variant = "shop",
}: Props) {
  const fields = product.customFields;
  if (!fields?.length) return null;

  const shell =
    variant === "premium" ?
      "border border-black/10 bg-white/80 p-5 space-y-4"
    : "bg-gold-50/30 border border-gold-100/50 rounded-2xl p-5 space-y-4";

  return (
    <div className={shell}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-[#8a6d3b]" aria-hidden />
        <h3 className="text-sm font-bold text-navy-900">
          Personalize your piece
        </h3>
      </div>
      <div className="space-y-3.5">
        {fields.map((field) => (
          <div key={`${product._id}-${field.label}`} className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-tight">
              {field.label}{" "}
              {field.isRequired ? <span className="text-red-500">*</span> : null}
            </label>
            {field.fieldType === "select" ?
              <select
                value={answers[field.label] || ""}
                onChange={(e) => onChange(field.label, e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
              >
                <option value="">Select option</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            : field.fieldType === "textarea" ?
              <textarea
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}...`
                }
                value={answers[field.label] || ""}
                onChange={(e) => onChange(field.label, e.target.value)}
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none"
              />
            : field.fieldType === "image" ?
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                  {uploadingFieldImages[field.label] ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!uploadingFieldImages[field.label]}
                    onChange={(e) => onImageUpload(field.label, e.target.files?.[0])}
                  />
                </label>
                {answers[field.label] ?
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={answers[field.label]}
                      alt={field.label}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                : null}
              </div>
            : <input
                type="text"
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}...`
                }
                value={answers[field.label] || ""}
                onChange={(e) => onChange(field.label, e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
              />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

export function validateRequiredCustomFields(
  product: Pick<Product, "customFields">,
  answers: Record<string, string>,
): string | null {
  const missing = product.customFields?.find(
    (f) => f.isRequired && !answers[f.label]?.trim(),
  );
  return missing ? missing.label : null;
}

export function customFieldAnswersToPayload(
  answers: Record<string, string>,
): Array<{ label: string; value: string }> {
  return Object.entries(answers).map(([label, value]) => ({ label, value }));
}
