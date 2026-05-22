"use client";

import { useCallback, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { adminAiApi } from "@/lib/adminAiApi";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminAiStatus, aiErrorMessage } from "@/components/admin/ai/useAdminAi";
import { AdminAiFormattedContent } from "@/components/admin/ai/AdminAiFormattedContent";
import type { AdminAiChatTurn, AdminAiTextResult } from "@/components/admin/ai/types";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  bullets?: string[];
  intro?: string;
  cached?: boolean;
};

const STARTERS = [
  "Give me today's business overview",
  "Yesterday's orders and revenue",
  "Profit and operating costs this month",
  "What are my best-selling products?",
  "Where are operating expenses going?",
  "Projected sales for this month",
];

const FOLLOW_UPS = [
  "Top products by views",
  "Online vs in-store breakdown",
  "Restock priorities",
  "Returns summary",
];

export default function AdminAiPage() {
  const { status, loading: statusLoading } = useAdminAiStatus();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || sending || !status?.enabled) return;

      const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: q };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setSending(true);

      const history: AdminAiChatTurn[] = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 800),
        }));

      try {
        const res = await adminAiApi.askStore(q, history.length > 0 ? history : undefined);
        const d = res.data as AdminAiTextResult;
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: d.text,
            bullets: d.bullets,
            intro: d.intro,
            cached: d.cached,
          },
        ]);
        scrollToBottom();
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: aiErrorMessage(e),
          },
        ]);
        scrollToBottom();
      } finally {
        setSending(false);
      }
    },
    [sending, status?.enabled, messages],
  );

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  if (statusLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!status?.enabled) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 max-w-2xl mx-auto">
        <AdminPageHeader
          title="Business Assistant"
          description="AI is not available until the server is configured."
        />
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold mb-2">Setup required</p>
          <p>
            Add your API key to the backend environment file and restart the server. Contact your
            developer if you need help.
          </p>
          <Link
            href="/admin"
            className="inline-block mt-4 text-brand-600 font-medium text-sm hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-violet-50/30">
      <div className="p-4 sm:p-6 xl:p-8 max-w-4xl mx-auto space-y-5">
        <AdminPageHeader
          title="Business Assistant"
          description="Ask questions about orders, revenue, profit, inventory, and expenses. Answers use your live store data."
          actions={
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-violet-300 transition-colors"
            >
              Dashboard
            </Link>
          }
        />

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[480px] max-h-[calc(100dvh-10rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5 bg-gray-50/80">
            <p className="text-xs text-slate-500">
              This chat remembers your last few messages for follow-up questions.
            </p>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-slate-600"
                onClick={clearChat}
                disabled={sending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                New chat
              </Button>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[300px]">
            {messages.length === 0 && (
              <div className="text-center py-8 px-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand-600 text-white mb-4">
                  <Bot className="h-7 w-7" />
                </div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">
                  How can I help?
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  Pick a topic below or type your own question. Figures include online orders and
                  in-store sales where payment is recorded.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      disabled={sending}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50 transition disabled:opacity-50 shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-4 py-3",
                    m.role === "user"
                      ? "bg-navy-900 text-white rounded-br-md text-sm leading-relaxed"
                      : "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-md",
                  )}
                >
                  {m.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <AdminAiFormattedContent
                      text={m.content}
                      bullets={m.bullets}
                      intro={m.intro}
                    />
                  )}
                </div>
                {m.role === "user" && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}

            {sending && (
              <p className="text-xs text-slate-500 flex items-center gap-2 pl-10">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                Working on your answer…
              </p>
            )}

            {messages.length > 0 && !sending && (
              <div className="pl-10 flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 w-full">
                  Related questions
                </span>
                {FOLLOW_UPS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-900 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="border-t border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row gap-2 bg-gray-50/80"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about sales, profit, stock, or expenses…"
              maxLength={500}
              rows={2}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/50 min-h-[44px]"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-700 shrink-0 h-11 sm:h-auto sm:px-5"
            >
              <Send className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-slate-400 leading-relaxed max-w-lg mx-auto">
          For major decisions, cross-check figures in Analytics. Suggestions here do not change
          orders, prices, or inventory automatically.
        </p>
      </div>
    </div>
  );
}
