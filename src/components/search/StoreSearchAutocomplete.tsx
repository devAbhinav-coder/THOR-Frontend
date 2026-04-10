"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { giftingApi, productApi } from "@/lib/api";
import type { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  buildStoreSearchHref,
  type StoreSearchScope,
} from "@/lib/storeSearchNav";

export type { StoreSearchScope };

const DEFAULT_MAX_LEN = 30;
const SUGGEST_MIN = 2;
const SUGGEST_LIMIT = 5;
const FETCH_DEBOUNCE_MS = 260;

const PLACEHOLDER_BY_SCOPE: Record<StoreSearchScope, string> = {
  shop: "Search sarees, lehengas, kurtis…",
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
  /** URL search param to sync when route changes (navbar) */
  urlSearch?: string;
  /** Controlled value (e.g. gifting page) */
  value?: string;
  onValueChange?: (v: string) => void;
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
): Promise<Product[]> {
  const trimmed = q.trim().slice(0, maxLen);
  if (trimmed.length < SUGGEST_MIN) return [];
  try {
    if (scope === "gifting") {
      const res = await giftingApi.getProducts({
        search: trimmed,
        page: 1,
        limit: SUGGEST_LIMIT,
      });
      return (res.data?.products || []) as Product[];
    }
    const res = await productApi.getAll({
      search: trimmed,
      page: 1,
      limit: SUGGEST_LIMIT,
    });
    return (res.data?.products || []) as Product[];
  } catch {
    return [];
  }
}

function StoreSearchAutocomplete({
  scope,
  variant,
  urlSearch = "",
  value: controlledValue,
  onValueChange,
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
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /** Fixed viewport position so the panel doesn’t extend the page / cause scroll */
  const [panelBox, setPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const isLightPanel = variant === "gifting-inline";

  useEffect(() => {
    let cancelled = false;
    if (debouncedQ.length < SUGGEST_MIN) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    void fetchSuggestions(scope, debouncedQ, maxLen).then((list) => {
      if (!cancelled) {
        setSuggestions(list.slice(0, SUGGEST_LIMIT));
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
      setOpen(false);
      router.push(buildStoreSearchHref(scope, inputValue, maxLen));
    },
    [router, scope, inputValue, maxLen],
  );

  const onClear = useCallback(() => {
    setInputValue("");
    setSuggestions([]);
    inputRef.current?.focus({ preventScroll: true });
  }, [setInputValue]);

  const showPanel =
    open &&
    inputValue.trim().length >= SUGGEST_MIN &&
    (suggestLoading || suggestions.length > 0);

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

  const placeholderText = placeholder ?? PLACEHOLDER_BY_SCOPE[scope];

  const inputBase =
    variant === "nav-dark" ?
      cn(
        "w-full rounded-xl border border-navy-600/80 bg-navy-800/90 py-2 pl-9 text-sm text-white shadow-inner placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden scroll-mt-24",
        inputValue ? "pr-9" : "pr-3",
      )
    : variant === "nav-mobile" ?
      "w-full rounded-xl border border-navy-600 bg-navy-800 py-2.5 pl-9 pr-10 text-sm text-white placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden scroll-mt-24"
    : "w-full rounded-xl border border-amber-200/80 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden";

  const iconLeft =
    variant === "gifting-inline" ? "left-3 text-amber-700" : "left-3 text-white/35";

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
              { "data-navbar-search-input": true }
            : {})}
            placeholder={placeholderText}
            className={cn(inputBase, inputClassName)}
          />
          {inputValue ?
            <button
              type='button'
              onClick={onClear}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1",
                isLightPanel ?
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
            "fixed z-[200] rounded-2xl border shadow-xl overflow-hidden overscroll-contain",
            isLightPanel ? "border-gray-200 bg-white" : "border-navy-600 bg-navy-900",
          )}
          style={{
            top: panelBox.top,
            left: panelBox.left,
            width: panelBox.width,
          }}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          {suggestLoading ?
            <div className='flex items-center justify-center gap-2 py-6 text-sm text-gray-500'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Searching…
            </div>
          : <ul className='py-1'>
              {suggestions.map((p) => {
                const img = p.images?.[0]?.url;
                return (
                  <li key={p._id} role='option' className='px-1'>
                    <Link
                      href={`/shop/${encodeURIComponent(p.slug)}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                        isLightPanel ? "hover:bg-brand-50" : "hover:bg-navy-800",
                      )}
                    >
                      <div className='relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                        {img ?
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=''
                            className='h-full w-full object-cover'
                          />
                        : null}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className={cn(
                            "line-clamp-2 text-sm font-semibold",
                            isLightPanel ? "text-gray-900" : "text-white",
                          )}
                        >
                          {p.name}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isLightPanel ? "text-brand-700" : "text-brand-300",
                          )}
                        >
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          }
          <div
            className={cn(
              "border-t px-3 py-2 text-center text-[11px]",
              isLightPanel ?
                "border-gray-100 text-gray-500"
              : "border-navy-700 text-white/60",
            )}
          >
            <Link
              href={resultsHref}
              onClick={() => setOpen(false)}
              className={cn(
                "font-semibold underline-offset-2 hover:underline",
                isLightPanel ? "text-brand-700" : "text-brand-300",
              )}
            >
              See all matching products
            </Link>
          </div>
        </div>
      : null}
    </div>
  );
}

export default memo(StoreSearchAutocomplete);
