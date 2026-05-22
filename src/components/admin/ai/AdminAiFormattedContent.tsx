"use client";

import { parseDisplayBullets, stripMarkdown } from "./formatAiContent";

type Props = {
  text?: string;
  bullets?: string[];
  intro?: string;
  className?: string;
};

export function AdminAiFormattedContent({ text = "", bullets, intro, className }: Props) {
  const parsed = parseDisplayBullets(text, bullets);
  const lead = stripMarkdown(intro?.trim() || parsed.intro);
  const items = (parsed.bullets.length > 0 ? parsed.bullets : bullets || []).map(stripMarkdown);

  if (!lead && items.length === 0 && !text.trim()) return null;

  if (items.length === 0) {
    return (
      <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${className ?? ""}`}>
        {text.trim()}
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {lead && (
        <p className="text-sm font-medium text-navy-900 leading-relaxed border-l-2 border-violet-400 pl-3">
          {lead}
        </p>
      )}
      <ul className="space-y-2.5">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
              {i + 1}
            </span>
            <span className="flex-1">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
