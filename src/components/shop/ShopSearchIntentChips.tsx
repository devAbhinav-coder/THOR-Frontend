"use client";

import {
  formatIntentAsQuery,
  parseSearchQueryIntent,
  type ParsedSearchIntent,
} from "@/lib/searchQueryParser";
import { cn } from "@/lib/utils";

type Props = {
  search: string;
  searchIntent?: ParsedSearchIntent | null;
  onApplySearch: (query: string) => void;
  className?: string;
};

function resolveTypoSuggestion(
  search: string,
  searchIntent?: ParsedSearchIntent | null,
): string | null {
  const intent = searchIntent ?? parseSearchQueryIntent(search);
  if (!intent.corrections.length) return null;
  const suggestion = (intent.didYouMean || formatIntentAsQuery(intent)).trim();
  if (!suggestion) return null;
  if (suggestion.toLowerCase() === search.trim().toLowerCase()) return null;
  return suggestion;
}

export default function ShopSearchIntentChips({
  search,
  searchIntent,
  onApplySearch,
  className,
}: Props) {
  const suggestion = resolveTypoSuggestion(search, searchIntent);
  if (!suggestion) return null;

  return (
    <p className={cn("mt-2 text-[13px] leading-relaxed text-gray-500", className)}>
      Did you mean{" "}
      <button
        type='button'
        onClick={() => onApplySearch(suggestion)}
        className='font-medium text-navy-900 underline decoration-[#c5a059]/60 underline-offset-4 transition-colors hover:text-[#c5a059]'
      >
        {suggestion}
      </button>
      ?
    </p>
  );
}
