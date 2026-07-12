"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useSyncExternalStore,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff, Search, X } from "lucide-react";
import { giftingApi, productApi } from "@/lib/api";
import type { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getVoiceSearchSnapshot,
  startVoiceSearch,
  stopVoiceSearch,
  subscribeVoiceSearch,
} from "@/lib/voiceSearchController";
import {
  SEARCH_QUERY_MAX_LEN,
  formatIntentAsQuery,
  parseSearchQueryIntent,
  type ParsedSearchIntent,
} from "@/lib/searchQueryParser";
import {
  buildStoreSearchHref,
  type StoreSearchScope,
} from "@/lib/storeSearchNav";
import {
  navDropdownAccent,
  navLuxuryDropdownFooter,
  navLuxuryDropdownHeader,
  navLuxuryDropdownNav,
  navLuxuryDropdownPanelStatic,
} from "@/lib/navbarStyles";

export type { StoreSearchScope };

const DEFAULT_MAX_LEN = SEARCH_QUERY_MAX_LEN;
const SUGGEST_MIN = 2;
const SUGGEST_LIMIT = 5;
const FETCH_DEBOUNCE_MS = 260;
const RECENT_SEARCHES_KEY = "pia-recent-searches";
const RECENT_SEARCHES_LIMIT = 5;

type SuggestPayload = {
  products: Product[];
  querySuggestions: string[];
  collectionSuggestions: Array<{ name: string; url: string; image?: string }>;
  didYouMean?: string;
  intent?: ParsedSearchIntent;
};

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, RECENT_SEARCHES_LIMIT) : [];
  } catch {
    return [];
  }
}

function uniqueQuerySuggestions(items: string[], exclude?: string): string[] {
  const excludeKey = exclude?.trim().toLowerCase() ?? "";
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || key === excludeKey || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pushRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (q.length < SUGGEST_MIN) return;
  try {
    const next = [q, ...readRecentSearches().filter((x) => x !== q)].slice(
      0,
      RECENT_SEARCHES_LIMIT,
    );
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

const PLACEHOLDER_BY_SCOPE: Record<StoreSearchScope, string> = {
  shop: "Try red saree, salwar suit under 500…",
  gifting: "Search gifts by name or occasion…",
};

const ARIA_SEARCH_LABEL: Record<StoreSearchScope, string> = {
  shop: "Search store",
  gifting: "Search gifting",
};

type Variant = "nav-dark" | "nav-mobile" | "gifting-inline";

type Props = {
  scope: StoreSearchScope;
  variant: Variant;
  /** Distinguishes desktop vs mobile navbar instances for focus targeting */
  searchInstance?: "desktop" | "mobile";
  /** URL search param to sync when route changes (navbar) */
  urlSearch?: string;
  /** Controlled value (e.g. gifting page) */
  value?: string;
  onValueChange?: (v: string) => void;
  /** Called after navigating to search results */
  onNavigate?: () => void;
  /** Input max length (gifting page may use longer queries) */
  maxLen?: number;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
};

async function fetchSuggestions(
  scope: StoreSearchScope,
  q: string,
  maxLen: number,
): Promise<SuggestPayload> {
  const trimmed = q.trim().slice(0, maxLen);
  if (trimmed.length < SUGGEST_MIN) {
    return { products: [], querySuggestions: [], collectionSuggestions: [] };
  }
  try {
    if (scope === "gifting") {
      const res = await giftingApi.getProducts({
        search: trimmed,
        page: 1,
        limit: SUGGEST_LIMIT,
      });
      return {
        products: (res.data?.products || []) as Product[],
        querySuggestions: [],
        collectionSuggestions: [],
      };
    }
    const res = await productApi.autocomplete(trimmed, SUGGEST_LIMIT);
    const raw = res.data?.suggestions || [];
    const products = raw.map((s) => {
      const item = s as {
        id?: string;
        _id?: string;
        name: string;
        slug: string;
        image?: string;
        price: number;
        category?: string;
      };
      const id = item._id ?? item.id ?? item.slug;
      return {
        _id: id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        category: item.category ?? "",
        images: item.image ? [{ url: item.image, publicId: "", alt: item.name }] : [],
      } as Product;
    });
    return {
      products,
      querySuggestions: uniqueQuerySuggestions(
        res.data?.querySuggestions ?? [],
        res.data?.didYouMean ?? res.data?.searchIntent?.didYouMean,
      ),
      collectionSuggestions: res.data?.collectionSuggestions ?? [],
      didYouMean: res.data?.didYouMean ?? res.data?.searchIntent?.didYouMean,
      intent: res.data?.searchIntent as ParsedSearchIntent | undefined,
    };
  } catch {
    try {
      const res = await productApi.getAll({
        search: trimmed,
        page: 1,
        limit: SUGGEST_LIMIT,
      });
      return {
        products: (res.data?.products || []) as Product[],
        querySuggestions: [],
        collectionSuggestions: [],
      };
    } catch {
      return { products: [], querySuggestions: [], collectionSuggestions: [] };
    }
  }
}

function StoreSearchAutocomplete({
  scope,
  variant,
  searchInstance,
  urlSearch = "",
  value: controlledValue,
  onValueChange,
  onNavigate,
  maxLen = DEFAULT_MAX_LEN,
  className,
  inputClassName,
  placeholder,
}: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [internal, setInternal] = useState(
    () => controlledValue ?? urlSearch?.slice(0, maxLen) ?? "",
  );
  const isControlled = controlledValue !== undefined;
  const inputValue = isControlled ? controlledValue : internal;

  const setInputValue = useCallback(
    (v: string) => {
      const next = v.slice(0, maxLen);
      if (isControlled) onValueChange?.(next);
      else setInternal(next);
    },
    [isControlled, onValueChange, maxLen],
  );

  useEffect(() => {
    if (isControlled) return;
    setInternal((prev) => {
      const next = (urlSearch || "").slice(0, maxLen);
      return next === prev ? prev : next;
    });
  }, [urlSearch, isControlled, maxLen]);

  const debouncedQ = useDebouncedValue(inputValue.trim(), FETCH_DEBOUNCE_MS);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [collectionSuggestions, setCollectionSuggestions] = useState<
    Array<{ name: string; url: string; image?: string }>
  >([]);
  const [didYouMean, setDidYouMean] = useState<string | undefined>();
  const [searchIntent, setSearchIntent] = useState<ParsedSearchIntent | undefined>();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /** Fixed viewport position so the panel doesn’t extend the page / cause scroll */
  const [panelBox, setPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const isLuxuryPanel = variant !== "gifting-inline";
  const showVoice = scope === "shop" && (variant === "nav-dark" || variant === "nav-mobile");

  const navigateToQuery = useCallback(
    (query: string) => {
      const q = query.trim().slice(0, maxLen);
      if (!q.length) return;
      pushRecentSearch(q);
      setOpen(false);
      onNavigate?.();
      router.push(buildStoreSearchHref(scope, q, maxLen));
    },
    [router, scope, maxLen, onNavigate],
  );

  const voiceActive = useSyncExternalStore(
    subscribeVoiceSearch,
    () => getVoiceSearchSnapshot().active,
    () => false,
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      const parsed = parseSearchQueryIntent(transcript);
      const next = formatIntentAsQuery(parsed) || transcript.trim();
      setInputValue(next.slice(0, maxLen));
      navigateToQuery(next);
    },
    [maxLen, navigateToQuery, setInputValue],
  );

  const handleMicPress = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (voiceActive) {
        stopVoiceSearch();
        return;
      }
      // Sync call — must stay in click handler (no async wrapper).
      startVoiceSearch("en-IN", { onResult: handleVoiceResult });
    },
    [voiceActive, handleVoiceResult],
  );

  useEffect(() => {
    if (!open) return;
    setRecentSearches(readRecentSearches());
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQ.length < SUGGEST_MIN) {
      setSuggestions([]);
      setQuerySuggestions([]);
      setCollectionSuggestions([]);
      setDidYouMean(undefined);
      setSearchIntent(undefined);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    void fetchSuggestions(scope, debouncedQ, maxLen).then((payload) => {
      if (!cancelled) {
        setSuggestions(payload.products.slice(0, SUGGEST_LIMIT));
        setQuerySuggestions(payload.querySuggestions.slice(0, 4));
        setCollectionSuggestions(payload.collectionSuggestions.slice(0, 3));
        setDidYouMean(payload.didYouMean);
        setSearchIntent(payload.intent);
        setSuggestLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, scope, maxLen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const resultsHref = useMemo(
    () => buildStoreSearchHref(scope, inputValue, maxLen),
    [inputValue, scope, maxLen],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim().slice(0, maxLen);
      if (!q.length) return;
      navigateToQuery(q);
    },
    [inputValue, maxLen, navigateToQuery],
  );

  const onClear = useCallback(() => {
    setInputValue("");
    setSuggestions([]);
    setQuerySuggestions([]);
    setCollectionSuggestions([]);
    setDidYouMean(undefined);
    setSearchIntent(undefined);
    inputRef.current?.focus({ preventScroll: true });
  }, [setInputValue]);

  const applySuggestion = useCallback(
    (query: string) => {
      const cleaned = query
        .replace(/\s*[·•|,]+\s*/g, " ")
        .replace(/Under\s*₹?\s*([\d,]+)/gi, "under $1")
        .replace(/Above\s*₹?\s*([\d,]+)/gi, "above $1")
        .replace(/\s+/g, " ")
        .trim();
      const parsed = parseSearchQueryIntent(cleaned);
      const next = (formatIntentAsQuery(parsed) || cleaned).slice(0, maxLen);
      setInputValue(next);
      navigateToQuery(next);
    },
    [navigateToQuery, setInputValue, maxLen],
  );

  const trimmedInput = inputValue.trim();
  const showRecentPanel =
    open && trimmedInput.length === 0 && recentSearches.length > 0;
  const showPanel =
    open &&
    (showRecentPanel ||
      (trimmedInput.length >= SUGGEST_MIN &&
        (suggestLoading ||
          suggestions.length > 0 ||
          querySuggestions.length > 0 ||
          collectionSuggestions.length > 0 ||
          Boolean(didYouMean) ||
          Boolean(searchIntent?.displayLabel))));

  const updatePanelBox = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelBox({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 200),
    });
  }, []);

  useLayoutEffect(() => {
    if (!showPanel) {
      setPanelBox(null);
      return;
    }
    updatePanelBox();
    window.addEventListener("scroll", updatePanelBox, true);
    window.addEventListener("resize", updatePanelBox);
    return () => {
      window.removeEventListener("scroll", updatePanelBox, true);
      window.removeEventListener("resize", updatePanelBox);
    };
  }, [showPanel, updatePanelBox]);

  const basePlaceholder = placeholder ?? PLACEHOLDER_BY_SCOPE[scope];
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(basePlaceholder);

  useEffect(() => {
    // If a custom placeholder is passed in, respect it and skip animation.
    if (placeholder) {
      setAnimatedPlaceholder(basePlaceholder);
      return;
    }
    // Only run typing effect for navbar variants so other usages stay static.
    if (!(variant === "nav-dark" || variant === "nav-mobile")) {
      setAnimatedPlaceholder(basePlaceholder);
      return;
    }

    const text = "What are you looking for?";
    let i = 0;
    let holdTicks = 0;
    const HOLD_MAX = 10; // how long to keep full text before resetting

    const interval = window.setInterval(() => {
      // typing phase
      if (i < text.length) {
        i += 1;
        setAnimatedPlaceholder(text.slice(0, i));
        return;
      }

      // full text phase (includes question mark), just hold
      if (holdTicks < HOLD_MAX) {
        holdTicks += 1;
        setAnimatedPlaceholder(text);
        return;
      }

      // reset and start again
      i = 0;
      holdTicks = 0;
      setAnimatedPlaceholder(text.charAt(0));
    }, 120);

    return () => window.clearInterval(interval);
  }, [variant, basePlaceholder, placeholder]);

  const placeholderText =
    variant === "nav-dark" || variant === "nav-mobile"
      ? animatedPlaceholder
      : basePlaceholder;

  const inputBase =
    variant === "nav-dark" ?
      cn(
        "w-full rounded-none border border-navy-600/80 bg-navy-800/90 py-2 pl-9 text-sm text-white shadow-inner placeholder:text-white/40 focus:border-[#c5a059]/60 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/25 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden scroll-mt-24",
        showVoice ? (inputValue ? "pr-16" : "pr-10") : inputValue ? "pr-9" : "pr-3",
      )
    : variant === "nav-mobile" ?
      cn(
        "w-full rounded-none border border-navy-600 bg-navy-800 py-2.5 pl-9 text-sm text-white placeholder:text-white/40 focus:border-[#c5a059]/60 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/25 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden scroll-mt-24",
        showVoice ? "pr-16" : "pr-10",
      )
    : "w-full rounded-none border border-gray-200/80 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#c5a059]/60 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden";

  const iconLeft =
    variant === "gifting-inline" ?
      "left-3 text-[#c5a059]"
    : "left-3 text-white/35";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={onSubmit}
        {...(variant === "nav-dark" || variant === "nav-mobile" ?
          { "data-navbar-search": "" as const }
        : {})}
      >
        <div className='relative'>
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2",
              iconLeft,
            )}
            aria-hidden
          />
          <input
            ref={inputRef}
            id={listId}
            type='search'
            name='store-product-search'
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='off'
            spellCheck={false}
            enterKeyHint='search'
            maxLength={maxLen}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setOpen(true)}
            aria-label={ARIA_SEARCH_LABEL[scope]}
            aria-expanded={showPanel}
            aria-controls={showPanel ? `${listId}-listbox` : undefined}
            aria-autocomplete='list'
            role='combobox'
            {...(variant === "nav-dark" || variant === "nav-mobile" ?
              {
                "data-navbar-search-input": true,
                ...(searchInstance ?
                  { "data-navbar-search-instance": searchInstance }
                : {}),
              }
            : {})}
            placeholder={placeholderText}
            className={cn(inputBase, inputClassName)}
          />
          {showVoice ?
            <button
              type='button'
              onClick={handleMicPress}
              className={cn(
                "absolute top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5",
                inputValue ? "right-8" : "right-2",
                voiceActive ?
                  "animate-pulse bg-red-500/20 text-red-400"
                : "text-white/45 hover:bg-navy-700 hover:text-white",
              )}
              aria-label={voiceActive ? "Stop voice search" : "Voice search"}
              aria-pressed={voiceActive}
            >
              {voiceActive ?
                <MicOff className='h-3.5 w-3.5' />
              : <Mic className='h-3.5 w-3.5' />}
            </button>
          : null}
          {inputValue ?
            <button
              type='button'
              onClick={onClear}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1",
                variant === "gifting-inline" ?
                  "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                : "text-white/45 hover:bg-navy-700 hover:text-white",
              )}
              aria-label='Clear search'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          : null}
        </div>
      </form>

      {showPanel && panelBox ?
        <div
          id={`${listId}-listbox`}
          role='listbox'
          className={cn(
            "fixed z-[200] overscroll-contain",
            isLuxuryPanel ?
              cn(navLuxuryDropdownPanelStatic, "min-w-[15.5rem]")
            : "overflow-hidden border border-gray-200 bg-white shadow-xl",
          )}
          style={{
            top: panelBox.top,
            left: panelBox.left,
            width: Math.max(panelBox.width, isLuxuryPanel ? 248 : 200),
          }}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          {isLuxuryPanel ?
            <>
              <div className={navDropdownAccent} aria-hidden />
              <div className={cn(navLuxuryDropdownHeader, "py-4")}>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#c5a059]">
                  Search
                </p>
                <p className="mt-1 truncate font-serif text-base font-medium text-white/90">
                  {inputValue.trim() || "Suggestions"}
                </p>
              </div>

              <div className={navLuxuryDropdownNav}>
                {showRecentPanel ?
                  <ul>
                    <li className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a2b48]/45">
                      Recent searches
                    </li>
                    {recentSearches.map((q) => (
                      <li key={q} className="border-b border-[#c5a059]/15 last:border-b-0">
                        <button
                          type="button"
                          role="option"
                          onClick={() => applySuggestion(q)}
                          className="block w-full px-5 py-3 text-left font-serif text-[14px] text-[#1a2b48] transition-colors hover:bg-white"
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                : suggestLoading ?
                  <div className="flex items-center justify-center gap-2 px-5 py-8 text-[13px] text-[#1a2b48]/60">
                    <Loader2 className="h-4 w-4 animate-spin text-[#c5a059]" />
                    Searching…
                  </div>
                : <>
                    {didYouMean && didYouMean.toLowerCase() !== trimmedInput.toLowerCase() ?
                      <div className="border-b border-[#c5a059]/15 px-5 py-3">
                        <button
                          type="button"
                          onClick={() => applySuggestion(didYouMean)}
                          className="text-left text-[13px] text-[#1a2b48]"
                        >
                          Did you mean{" "}
                          <span className="font-semibold text-[#c5a059]">{didYouMean}</span>?
                        </button>
                      </div>
                    : null}
                    {searchIntent?.displayLabel &&
                    searchIntent.displayLabel.toLowerCase() !== trimmedInput.toLowerCase() ?
                      <div className="border-b border-[#c5a059]/15 px-5 py-2 text-[12px] text-[#1a2b48]/70">
                        {searchIntent.displayLabel}
                      </div>
                    : null}
                    {querySuggestions.length > 0 ?
                      <ul>
                        {querySuggestions.map((q, index) => (
                          <li
                            key={`${q}-${index}`}
                            className="border-b border-[#c5a059]/15 last:border-b-0"
                          >
                            <button
                              type="button"
                              role="option"
                              onClick={() => applySuggestion(q)}
                              className="block w-full px-5 py-2.5 text-left text-[13px] text-[#1a2b48] transition-colors hover:bg-white"
                            >
                              {q}
                            </button>
                          </li>
                        ))}
                      </ul>
                    : null}
                    {collectionSuggestions.length > 0 ?
                      <ul>
                        <li className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a2b48]/45">
                          Collections
                        </li>
                        {collectionSuggestions.map((item) => (
                          <li
                            key={item.url}
                            className="border-b border-[#c5a059]/15 last:border-b-0"
                          >
                            <Link
                              href={item.url}
                              onClick={() => {
                                setOpen(false);
                                onNavigate?.();
                              }}
                              className="block px-5 py-2.5 text-left text-[13px] text-[#1a2b48] transition-colors hover:bg-white"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    : null}
                    <ul>
                      {suggestions.map((p) => {
                      const img = p.images?.[0]?.url;
                      return (
                        <li
                          key={p._id}
                          role="option"
                          className="border-b border-[#c5a059]/15 last:border-b-0"
                        >
                          <Link
                            href={`/shop/${encodeURIComponent(p.slug)}`}
                            onClick={() => {
                              setOpen(false);
                              onNavigate?.();
                            }}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white"
                          >
                            <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-gray-100">
                              {img ?
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 font-serif text-[14px] leading-snug text-[#1a2b48]">
                                {p.name}
                              </p>
                              <p className="mt-0.5 text-[12px] font-medium text-[#c5a059]">
                                {formatPrice(p.price)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                    </ul>
                  </>
                }
              </div>

              {trimmedInput.length >= SUGGEST_MIN ?
                <div className={cn(navLuxuryDropdownFooter, "text-center")}>
                <Link
                  href={resultsHref}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#c5a059] transition-colors hover:text-[#1a2b48]"
                >
                  See all matching products
                </Link>
                </div>
              : null}
            </>
          : <>
              {showRecentPanel ?
                <ul className="py-1">
                  <li className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Recent searches
                  </li>
                  {recentSearches.map((q) => (
                    <li key={q} role="option" className="px-1">
                      <button
                        type="button"
                        onClick={() => applySuggestion(q)}
                        className="block w-full rounded px-2 py-2 text-left text-sm text-gray-800 hover:bg-[#fff8eb]"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              : suggestLoading ?
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              : <>
                  {didYouMean && didYouMean.toLowerCase() !== trimmedInput.toLowerCase() ?
                    <div className="border-b border-gray-100 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => applySuggestion(didYouMean)}
                        className="text-left text-sm text-gray-700"
                      >
                        Did you mean{" "}
                        <span className="font-semibold text-[#c5a059]">{didYouMean}</span>?
                      </button>
                    </div>
                  : null}
                  {querySuggestions.length > 0 ?
                    <ul className="border-b border-gray-100 py-1">
                      {querySuggestions.map((q, index) => (
                        <li key={`${q}-${index}`} role="option" className="px-1">
                          <button
                            type="button"
                            onClick={() => applySuggestion(q)}
                            className="block w-full rounded px-2 py-2 text-left text-sm text-gray-800 hover:bg-[#fff8eb]"
                          >
                            {q}
                          </button>
                        </li>
                      ))}
                    </ul>
                  : null}
                  {collectionSuggestions.length > 0 ?
                    <ul className="border-b border-gray-100 py-1">
                      <li className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Collections
                      </li>
                      {collectionSuggestions.map((item) => (
                        <li key={item.url} role="option" className="px-1">
                          <Link
                            href={item.url}
                            onClick={() => {
                              setOpen(false);
                              onNavigate?.();
                            }}
                            className="block rounded px-2 py-2 text-left text-sm text-gray-800 hover:bg-[#fff8eb]"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  : null}
                  <ul className="py-1">
                  {suggestions.map((p) => {
                    const img = p.images?.[0]?.url;
                    return (
                      <li key={p._id} role="option" className="px-1">
                        <Link
                          href={`/shop/${encodeURIComponent(p.slug)}`}
                          onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                          }}
                          className="flex gap-3 px-2 py-2 text-left transition-colors hover:bg-[#fff8eb]"
                        >
                          <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-gray-100">
                            {img ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                              {p.name}
                            </p>
                            <p className="text-xs text-[#c5a059]">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                  </ul>
                </>
              }
              {trimmedInput.length >= SUGGEST_MIN ?
                <div className="border-t border-gray-100 px-3 py-2 text-center text-[11px] text-gray-500">
                <Link
                  href={resultsHref}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="font-semibold text-[#c5a059] underline-offset-2 hover:underline"
                >
                  See all matching products
                </Link>
                </div>
              : null}
            </>
          }
        </div>
      : null}
    </div>
  );
}

export default memo(StoreSearchAutocomplete);
