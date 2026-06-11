"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, RefreshCw, X, Search } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import { BLOG_CATEGORIES } from "@/lib/blogHelpers";
import type { Product } from "@/types";

export type BlogCopyDraft = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  readingTimeMin?: number;
  suggestedImageCaptions?: string[];
  duplicateWarnings?: string[];
  titleOptions?: string[];
  keywordSuggestions?: string[];
  internalLinks?: Array<{ productSlug: string; anchorText: string }>;
  aiPromptSnapshot?: string;
  linkProductIds?: string[];
};

const TONE_OPTIONS = [
  { value: "warm expert", label: "Warm Expert" },
  { value: "conversational friendly", label: "Conversational Friendly" },
  { value: "bridal luxury", label: "Bridal Luxury" },
  { value: "practical guide", label: "Practical Guide" },
  { value: "festive celebratory", label: "Festive Celebratory" },
];

type Props = {
  onApply: (draft: BlogCopyDraft) => void;
  prefill?: { topic?: string; keywords?: string; category?: string };
};

export function AdminAiBlogDraftSection({ onApply, prefill }: Props) {
  const { status, loading: statusLoading, refresh } = useAdminAiStatus();

  useEffect(() => {
    void refresh();
  }, [refresh]);
  const [topic, setTopic] = useState(prefill?.topic || "");
  const [keywordsText, setKeywordsText] = useState(prefill?.keywords || "");
  const [category, setCategory] = useState(prefill?.category || "saree-styling");
  const [tone, setTone] = useState("warm expert");
  const [targetLength, setTargetLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [lastDraft, setLastDraft] = useState<BlogCopyDraft | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const keywordPreview = useMemo(
    () =>
      keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 12),
    [keywordsText],
  );

  const searchProducts = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await adminApi.searchProducts({ search: q.trim(), limit: 8 });
      setProductResults((res.data?.products as Product[]) || []);
    } catch {
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  if (statusLoading) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 flex items-center gap-2 text-sm text-violet-700">
        <Loader2 className="w-4 h-4 animate-spin" />
        AI status check ho raha hai…
      </div>
    );
  }

  if (!status?.blogEnabled) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
        <strong>Blog AI off.</strong> Backend <code className="text-[10px]">.env</code> mein{" "}
        <code className="text-[10px]">GEMINI_API_KEY</code> set karo,{" "}
        <code className="text-[10px]">GEMINI_MODEL=gemini-2.5-flash</code>, phir server restart.
      </div>
    );
  }

  const run = async (regenerate = false) => {
    if (topic.trim().length < 8) {
      toast.error("Topic kam se kam 8 characters likho");
      return;
    }
    setLoading(true);
    if (regenerate) setTitleOptions([]);
    try {
      const res = await adminAiApi.draftBlogPost({
        topic: topic.trim(),
        keywords: keywordPreview.length ? keywordPreview : undefined,
        category,
        targetLength,
        tone,
        linkProductIds: selectedProducts.map((p) => p._id),
        includeProductLinks: true,
        regenerate,
      });
      const d = res.data as BlogCopyDraft;
      if (!d?.content?.trim()) {
        toast.error("AI response empty — topic detail se likho aur retry");
        return;
      }
      if (d.duplicateWarnings?.length) setWarnings(d.duplicateWarnings);
      else setWarnings([]);
      if (d.titleOptions?.length) {
        setTitleOptions(d.titleOptions);
        setSelectedTitle(d.title || d.titleOptions[0]);
      }
      if (d.keywordSuggestions?.length) setKeywordSuggestions(d.keywordSuggestions);
      setLastDraft(d);
      toast.success(regenerate ? "New draft generated" : "Blog draft ready — pick a title below");
    } catch (e) {
      toast.error(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const applyDraft = () => {
    if (!lastDraft) {
      toast.error("Pehle draft generate karo");
      return;
    }
    const title = selectedTitle || lastDraft.title;
    onApply({
      ...lastDraft,
      title,
      seoTitle: title?.slice(0, 70),
      linkProductIds: selectedProducts.map((p) => p._id),
      aiPromptSnapshot: topic.trim(),
    });
    toast.success("Draft applied to form");
  };

  const addProduct = (p: Product) => {
    if (selectedProducts.some((x) => x._id === p._id)) return;
    setSelectedProducts((prev) => [...prev, p].slice(0, 6));
    setProductSearch("");
    setProductResults([]);
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-4 sm:p-5 space-y-4 w-full">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-900 leading-relaxed">
          <strong>AI Journal Writer (Gemini + RAG):</strong> Topic + keywords + products → unique SEO
          article. {status?.blogProvider === "gemini" ? `Model: ${status.blogModel || "gemini"}.` : ""}{" "}
          MongoDB vector similarity — no Pinecone.
        </p>
      </div>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Topic: Banarasi saree draping for wedding reception"
        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        disabled={loading}
      />

      <input
        value={keywordsText}
        onChange={(e) => setKeywordsText(e.target.value)}
        placeholder="Keywords: banarasi saree, wedding styling (comma separated)"
        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        disabled={loading}
      />

      {keywordSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-violet-700 font-semibold w-full">RAG keyword ideas:</span>
          {keywordSuggestions.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                const parts = keywordsText.split(",").map((s) => s.trim()).filter(Boolean);
                if (!parts.includes(k)) setKeywordsText([...parts, k].join(", "));
              }}
              className="text-[10px] uppercase tracking-wide bg-violet-100 hover:bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full"
            >
              + {k}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs"
          disabled={loading}
        >
          {BLOG_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs"
          disabled={loading}
        >
          {TONE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={targetLength}
          onChange={(e) => setTargetLength(e.target.value as "short" | "medium" | "long")}
          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs"
          disabled={loading}
        >
          <option value="short">Short (~600 words)</option>
          <option value="medium">Medium (~900 words)</option>
          <option value="long">Long (~1300 words)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-violet-900">Link products (multi-select)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              void searchProducts(e.target.value);
            }}
            placeholder="Search products to link in article…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-violet-200 text-xs"
            disabled={loading}
          />
        </div>
        {searchingProducts && <p className="text-[10px] text-gray-500">Searching…</p>}
        {productResults.length > 0 && (
          <ul className="border border-violet-100 rounded-lg bg-white max-h-36 overflow-y-auto text-xs">
            {productResults.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2 hover:bg-violet-50 truncate"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedProducts.map((p) => (
              <span
                key={p._id}
                className="inline-flex items-center gap-1 bg-white border border-violet-200 rounded-full px-2.5 py-1 text-[11px]"
              >
                {p.name.slice(0, 28)}
                <button type="button" onClick={() => setSelectedProducts((prev) => prev.filter((x) => x._id !== p._id))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Similar posts — unique angle rakho
          </div>
          {warnings.map((w) => <p key={w}>{w}</p>)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px] rounded-xl border-violet-300 bg-white text-violet-900 gap-1.5"
          onClick={() => void run(false)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate draft
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-violet-300 gap-1.5"
          onClick={() => void run(true)}
          disabled={loading || !topic.trim()}
          title="Regenerate (skip cache)"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      {titleOptions.length > 0 && (
        <div className="rounded-xl border border-violet-100 bg-white p-3 space-y-2">
          <p className="text-xs font-bold text-violet-900">A/B Title — pick best headline</p>
          {titleOptions.map((t) => (
            <label key={t} className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="titleOption"
                checked={selectedTitle === t}
                onChange={() => setSelectedTitle(t)}
                className="mt-1"
              />
              <span className={selectedTitle === t ? "font-semibold text-violet-900" : "text-gray-700"}>{t}</span>
            </label>
          ))}
          <Button type="button" size="sm" className="w-full mt-2" onClick={applyDraft}>
            Apply selected draft to form
          </Button>
        </div>
      )}
    </div>
  );
}
