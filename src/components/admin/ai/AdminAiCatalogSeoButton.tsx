"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";

type Props = {
  kind: "category" | "subcategory";
  name: string;
  parentCategoryName?: string;
  description?: string;
  onApply: (patch: { metaTitle: string; metaDescription: string }) => void;
};

export function AdminAiCatalogSeoButton({
  kind,
  name,
  parentCategoryName,
  description,
  onApply,
}: Props) {
  const { status } = useAdminAiStatus();
  const [loading, setLoading] = useState(false);

  // Same provider as blog drafts (Gemini when GEMINI_API_KEY is set).
  if (!status?.blogEnabled) return null;

  const run = async () => {
    if (!name.trim()) {
      toast.error("Pehle name likho");
      return;
    }
    setLoading(true);
    try {
      const res = await adminAiApi.draftCatalogSeo({
        kind,
        name: name.trim(),
        parentCategoryName: parentCategoryName?.trim() || undefined,
        description: description?.trim() || undefined,
      });
      const metaTitle = String(res.data?.metaTitle || "").trim();
      const metaDescription = String(res.data?.metaDescription || "").trim();
      if (!metaTitle || !metaDescription) {
        toast.error("AI response empty — retry");
        return;
      }
      onApply({ metaTitle, metaDescription });
      toast.success("Meta title & description filled");
    } catch (e) {
      toast.error(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const providerLabel =
    status.blogProvider === "gemini" ? "Gemini" : "Groq";

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
      <p className="text-[11px] text-violet-900 leading-snug">
        <strong>AI SEO ({providerLabel}):</strong> name se unique meta title +
        description generate karke fields fill karega (India shop intent).
      </p>
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
        {loading ? "Generating SEO…" : "AI fill meta title & description"}
      </Button>
    </div>
  );
}
