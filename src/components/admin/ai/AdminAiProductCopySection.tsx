"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import type { Product } from "@/types";
import { mergeFabricIntoProductDetails } from "@/lib/productDetailsBulk";

export type ProductCopyDraft = {
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  productDetailKeys?: string;
  productDetailValues?: string;
  text?: string;
};

type Props = {
  name: string;
  category?: string;
  subcategory?: string;
  fabric?: string;
  price?: string;
  comparePrice?: string;
  tags?: string;
  variants: Product["variants"];
  productId?: string;
  onApply: (draft: ProductCopyDraft) => void;
};

function tryParseDraftFromText(text: string): ProductCopyDraft | null {
  const t = text.trim();
  if (!t.startsWith("{")) return null;
  try {
    const j = JSON.parse(t) as ProductCopyDraft;
    return j;
  } catch {
    return null;
  }
}

export function applyProductCopyDraft(
  draft: ProductCopyDraft,
  apply: (patch: ProductCopyDraft) => void,
  opts?: { fabric?: string },
): string[] {
  const fromJson = draft.text?.trim().startsWith("{") ? tryParseDraftFromText(draft.text) : null;
  const d = { ...draft, ...fromJson };

  const description = (d.description || d.text || "").trim();
  const filled: string[] = [];

  const patch: ProductCopyDraft = {};
  let shortDesc = d.shortDescription?.trim() || "";
  if (shortDesc.length < 110 && description) {
    const plain = description.replace(/^[-•*]\s+/gm, "").replace(/\n+/g, " ");
    const sentences = plain.split(/(?<=[.!?।])\s+/).filter((s) => s.length > 12);
    let out = "";
    for (const s of sentences) {
      const next = out ? `${out} ${s}` : s;
      if (next.length > 220) break;
      out = next;
      if (out.length >= 110) break;
    }
    shortDesc = (out || plain).slice(0, 220).trim();
  }
  if (shortDesc) {
    patch.shortDescription = shortDesc;
    filled.push("Short description");
  }
  if (description && !description.startsWith("{")) {
    patch.description = description;
    filled.push("Description");
  }
  if (d.seoTitle?.trim()) {
    patch.seoTitle = d.seoTitle.trim();
    filled.push("SEO title");
  }
  if (d.seoDescription?.trim()) {
    patch.seoDescription = d.seoDescription.trim();
    filled.push("SEO description");
  }
  if (d.tags?.length) {
    patch.tags = d.tags;
    filled.push("Tags");
  }
  const fabric = opts?.fabric?.trim() || "";
  const detailKeys = d.productDetailKeys?.trim() || "";
  const detailValues = d.productDetailValues?.trim() || "";
  if (detailKeys || detailValues || fabric) {
    const merged = mergeFabricIntoProductDetails(detailKeys, detailValues, fabric);
    if (merged.keys.trim()) {
      patch.productDetailKeys = merged.keys;
      patch.productDetailValues = merged.values;
      filled.push(fabric ? "Product detail table (incl. Fabric)" : "Product detail table");
    }
  }

  if (filled.length) apply(patch);
  return filled;
}

export function AdminAiProductCopySection({
  name,
  category,
  subcategory,
  fabric,
  price,
  comparePrice,
  tags,
  variants,
  productId,
  onApply,
}: Props) {
  const { status } = useAdminAiStatus();
  const [designNotes, setDesignNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const variantPreview = useMemo(
    () =>
      variants
        .filter((v) => v.sku || v.size || v.color)
        .map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-lg bg-white border border-violet-100 px-2 py-1 text-[11px] text-slate-700"
          >
            {v.size && <strong>{v.size}</strong>}
            {v.color && <span>· {v.color}</span>}
            {v.sku && <span className="text-slate-400">· {v.sku}</span>}
          </span>
        )),
    [variants],
  );

  if (!status?.enabled) return null;

  const run = async () => {
    if (!name.trim()) {
      toast.error("Pehle product name likho");
      return;
    }
    setLoading(true);
    try {
      const tagList = tags
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;
      const res = await adminAiApi.draftProductCopy({
        name: name.trim(),
        category,
        subcategory,
        fabric,
        price: price ? Number(price) : undefined,
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        tags: tagList,
        designNotes: designNotes.trim() || undefined,
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
        })),
        productId,
      });
      const raw = res.data as ProductCopyDraft;
      const filled = applyProductCopyDraft(raw, onApply, { fabric });
      if (!filled.length) {
        toast.error("AI response empty — design notes zyada detail se likho aur retry");
        return;
      }
      toast.success(`Form filled: ${filled.join(", ")}`);
    } catch (e) {
      toast.error(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2.5 w-full">
      <p className="text-[11px] text-violet-900 leading-snug">
        <strong>AI listing writer:</strong> Pehle <strong>Fabric</strong> select karo + design notes
        likho → 2-line short description, full description, SEO, specs table (Fabric, Length, Work…).
      </p>
      {variantPreview.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{variantPreview}</div>
      )}
      <textarea
        value={designNotes}
        onChange={(e) => setDesignNotes(e.target.value)}
        rows={2}
        placeholder="Design notes: peacock pallu, banarasi zari, silk, 5.5m, blouse included, festive/wedding…"
        className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs resize-y min-h-[52px] focus:outline-none focus:ring-2 focus:ring-violet-300"
        disabled={loading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full rounded-lg border-violet-300 bg-white text-violet-900 gap-1.5"
        onClick={() => void run()}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading ? "Generating full copy…" : "Generate & fill all fields"}
      </Button>
    </div>
  );
}
