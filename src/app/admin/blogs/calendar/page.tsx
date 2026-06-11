"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Trash2, Calendar, ArrowLeft, Sparkles, Loader2, TrendingUp, Check } from "lucide-react";
import toast from "react-hot-toast";
import { blogContentPlanApi } from "@/lib/api";
import { adminAiApi } from "@/lib/adminAiApi";
import { BLOG_CATEGORIES } from "@/lib/blogHelpers";
import { useAdminAiStatus, aiErrorMessage } from "@/components/admin/ai/useAdminAi";
import type { BlogContentPlan } from "@/types";

type AiPlanItem = {
  topic: string;
  keywords: string[];
  category: string;
  plannedDate: string;
  notes: string;
  trendScore: number;
  trendReason: string;
  festivalHook?: string;
};

export default function BlogCalendarPage() {
  const qc = useQueryClient();
  const { status } = useAdminAiStatus();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("saree-styling");
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");

  const [aiWeeks, setAiWeeks] = useState(4);
  const [aiFocus, setAiFocus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AiPlanItem[]>([]);
  const [selectedAi, setSelectedAi] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["blog-content-plans"],
    queryFn: async () => {
      const res = await blogContentPlanApi.getAll();
      const payload = res.data as { plans?: BlogContentPlan[] } | undefined;
      return payload?.plans ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: () =>
      blogContentPlanApi.create({
        topic,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        category,
        plannedDate: new Date(plannedDate).toISOString(),
        notes,
      }),
    onSuccess: () => {
      toast.success("Planned");
      setTopic("");
      setKeywords("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["blog-content-plans"] });
    },
    onError: () => toast.error("Failed to create plan"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => blogContentPlanApi.delete(id),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["blog-content-plans"] });
    },
  });

  const bulkMut = useMutation({
    mutationFn: (items: AiPlanItem[]) =>
      blogContentPlanApi.bulkCreate(
        items.map((i) => ({
          topic: i.topic,
          keywords: i.keywords,
          category: i.category,
          plannedDate: new Date(i.plannedDate).toISOString(),
          notes: [i.notes, i.trendReason, i.festivalHook ? `Festival: ${i.festivalHook}` : ""]
            .filter(Boolean)
            .join(" | "),
        })),
      ),
    onSuccess: () => {
      toast.success("Calendar updated");
      setAiSuggestions([]);
      setSelectedAi(new Set());
      qc.invalidateQueries({ queryKey: ["blog-content-plans"] });
    },
    onError: () => toast.error("Bulk add failed"),
  });

  const runAiPlan = async (regenerate = false) => {
    if (!status?.blogEnabled) {
      toast.error("GEMINI_API_KEY set karo backend .env mein");
      return;
    }
    setAiLoading(true);
    try {
      const res = await adminAiApi.planBlogCalendar({
        weeks: aiWeeks,
        postsPerWeek: 1,
        focus: aiFocus.trim() || undefined,
        regenerate,
      });
      const d = res.data as {
        summary?: string;
        items?: AiPlanItem[];
      };
      const items = d.items || [];
      setAiSummary(d.summary || "");
      setAiSuggestions(items);
      setSelectedAi(new Set(items.map((_, i) => i)));
      toast.success(`${items.length} topics planned — review & add`);
    } catch (e) {
      toast.error(aiErrorMessage(e));
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAi = (idx: number) => {
    setSelectedAi((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addSelectedToCalendar = () => {
    const items = aiSuggestions.filter((_, i) => selectedAi.has(i));
    if (!items.length) {
      toast.error("Kam se kam 1 topic select karo");
      return;
    }
    bulkMut.mutate(items);
  };

  const plans = data || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/blogs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to blogs
          </Link>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Calendar className="w-6 h-6 text-rose-600" />
            Content Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI + India trend seeds + festivals — plan karo, phir Draft with AI.
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New blog now
        </Link>
      </div>

      {status?.blogEnabled && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-violet-900">AI Content Planner (Gemini + Trends)</h2>
              <p className="text-xs text-violet-800/80 mt-1 leading-relaxed">
                India seasonal trends, upcoming festivals (Diwali, Rakhi, Navratri…), shop categories &amp;
                published blog gaps se auto plan. Google Trends API abhi alpha hai — hum local trend seeds use karte hain.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs font-medium text-gray-600">
              Weeks
              <select
                value={aiWeeks}
                onChange={(e) => setAiWeeks(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 text-sm bg-white"
                disabled={aiLoading}
              >
                {[2, 4, 6, 8].map((w) => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600 sm:col-span-2">
              Focus (optional)
              <input
                value={aiFocus}
                onChange={(e) => setAiFocus(e.target.value)}
                placeholder="e.g. monsoon saree care, rakhi gifting, banarasi bridal"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-violet-200 text-sm bg-white"
                disabled={aiLoading}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAiPlan(false)}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate {aiWeeks}-week plan
            </button>
            {aiSuggestions.length > 0 && (
              <button
                type="button"
                onClick={() => runAiPlan(true)}
                disabled={aiLoading}
                className="text-sm text-violet-700 hover:underline px-2"
              >
                Regenerate
              </button>
            )}
          </div>

          {aiSummary && (
            <p className="text-sm text-gray-700 bg-white/80 rounded-xl p-3 border border-violet-100">{aiSummary}</p>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Suggested topics</span>
                <button
                  type="button"
                  onClick={addSelectedToCalendar}
                  disabled={bulkMut.isPending || selectedAi.size === 0}
                  className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Add {selectedAi.size} to calendar
                </button>
              </div>
              {aiSuggestions.map((item, idx) => (
                <label
                  key={`${item.topic}-${idx}`}
                  className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white cursor-pointer hover:border-violet-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedAi.has(idx)}
                    onChange={() => toggleAi(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{item.topic}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full">
                        <TrendingUp className="w-3 h-3" /> {item.trendScore}
                      </span>
                      {item.festivalHook && (
                        <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                          {item.festivalHook}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(item.plannedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                      {item.category.replace(/-/g, " ")} · {item.keywords.slice(0, 4).join(", ")}
                    </p>
                    <p className="text-xs text-violet-700/80 mt-1">{item.trendReason}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Add planned topic (manual)</h2>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic for planned date"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Keywords (comma separated)"
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={plannedDate}
          onChange={(e) => setPlannedDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-y"
        />
        <button
          type="button"
          onClick={() => createMut.mutate()}
          disabled={!topic.trim() || !plannedDate || createMut.isPending}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Add to calendar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ?
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            : plans.length === 0 ?
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No planned topics — AI plan generate karo upar se</td></tr>
            : plans.map((plan) => (
              <tr key={plan._id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(plan.plannedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{plan.topic}</div>
                  {plan.keywords?.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">{plan.keywords.join(", ")}</div>
                  )}
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{plan.category?.replace(/-/g, " ")}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{plan.status}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/blogs/new?topic=${encodeURIComponent(plan.topic)}&keywords=${encodeURIComponent(plan.keywords?.join(", ") || "")}&category=${plan.category}`}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Draft with AI
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(plan._id)}
                    className="inline-flex text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
