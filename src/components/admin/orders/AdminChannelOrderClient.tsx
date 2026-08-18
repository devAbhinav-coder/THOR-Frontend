"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OrderLineThumbnail, {
  OfflineLinePlaceholderThumbnail,
} from "@/components/orders/OrderLineThumbnail";
import {
  ArrowLeft,
  Banknote,
  Check,
  HandIcon,
  MapPin,
  PackageSearch,
  PenLine,
  Plus,
  Smartphone,
  Store,
  Trash2,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { adminApi, categoryApi } from "@/lib/api";
import type { AdminCreateB2bOrderBody, AdminCreateOfflineOrderBody, Category, Product } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { cn, formatPrice } from "@/lib/utils";
import { hideScrollbarCls } from "@/components/admin/shared/AdminOfferFormUi";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/SearchField";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import toast from "react-hot-toast";

const OTHER_CATEGORY_VALUE = "__other__";

const pill =
  "rounded-xl border px-3 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

export type CatalogDraft = {
  id: string;
  kind: "catalog";
  pickLoading: boolean;
  selectedProduct: Product | null;
  variantSku: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
};

export type ManualDraft = {
  id: string;
  kind: "manual";
  categorySelect: string;
  customTitle: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
};

export type DraftLine = CatalogDraft | ManualDraft;

function variantCostFromProduct(product: Product | null, sku: string): number {
  if (!product || !sku) return 0;
  const v = product.variants.find((x) => x.sku === sku);
  const c = Number(v?.costPrice ?? 0);
  return Number.isFinite(c) && c >= 0 ? c : 0;
}

function formatCostInput(value: number): string {
  return value > 0 ? String(value) : "";
}

function lineUnitPrice(line: DraftLine): number {
  const n = Number(line.unitPrice);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function lineUnitCost(line: DraftLine): number {
  const n = Number(line.unitCost);
  if (Number.isFinite(n) && n >= 0) return n;
  if (line.kind === "catalog" && line.selectedProduct && line.variantSku) {
    return variantCostFromProduct(line.selectedProduct, line.variantSku);
  }
  return NaN;
}

function lineQty(line: DraftLine): number {
  return Math.max(1, Math.min(50, Math.floor(Number(line.quantity) || 1)));
}

function lineLabel(line: DraftLine, shopCategories: Category[]): string {
  if (line.kind === "catalog") {
    const p = line.selectedProduct;
    if (!p) return "Catalog product";
    const v = p.variants.find((x) => x.sku === line.variantSku);
    const vLabel = v
      ? [v.size, v.color].filter(Boolean).join(" · ") || v.sku
      : line.variantSku;
    return vLabel ? `${p.name} (${vLabel})` : p.name;
  }
  if (line.categorySelect === OTHER_CATEGORY_VALUE) {
    return line.customTitle.trim() || "Custom line";
  }
  const cat = shopCategories.find((c) => c._id === line.categorySelect);
  return cat?.name || "Category line";
}

function newLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ?
      crypto.randomUUID()
    : `ln_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function catalogWithId(id: string): CatalogDraft {
  return {
    id,
    kind: "catalog",
    pickLoading: false,
    selectedProduct: null,
    variantSku: "",
    quantity: 1,
    unitPrice: "",
    unitCost: "",
  };
}

function manualWithId(id: string): ManualDraft {
  return {
    id,
    kind: "manual",
    categorySelect: "",
    customTitle: "",
    quantity: 1,
    unitPrice: "",
    unitCost: "",
  };
}

function emptyManualDraft(): ManualDraft {
  return manualWithId(newLineId());
}

function LineProfitHint({ line }: { line: DraftLine }) {
  const up = lineUnitPrice(line);
  const uc = lineUnitCost(line);
  const q = lineQty(line);
  if (!Number.isFinite(up)) return null;

  const revenue = up * q;
  const cogs = Number.isFinite(uc) ? uc * q : 0;
  const profit = revenue - cogs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const missingCost = !Number.isFinite(uc) || uc <= 0;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs",
        missingCost ?
          "border-amber-200 bg-amber-50/80 text-amber-900"
        : "border-emerald-200 bg-emerald-50/60 text-emerald-900",
      )}
    >
      <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
        <span>
          Revenue: <strong className='tabular-nums'>{formatPrice(revenue)}</strong>
        </span>
        <span>
          COGS:{" "}
          <strong className='tabular-nums'>
            {Number.isFinite(uc) ? formatPrice(cogs) : "—"}
          </strong>
        </span>
        <span>
          Profit: <strong className='tabular-nums'>{formatPrice(profit)}</strong>
          {revenue > 0 && Number.isFinite(uc) ?
            <span className='text-[10px] opacity-80'> ({margin.toFixed(0)}%)</span>
          : null}
        </span>
      </div>
      {missingCost ?
        <p className='mt-1 text-[10px] opacity-90'>
          Enter cost of goods for this line so revenue reports stay accurate.
        </p>
      : null}
    </div>
  );
}

function buildCatalogLineFromProduct(full: Product, id?: string): CatalogDraft | null {
  if (!full.variants?.length) return null;
  const first = full.variants[0]!;
  const listed =
    typeof first.price === "number" && first.price >= 0 ? first.price : full.price;
  const cost = variantCostFromProduct(full, first.sku);
  return {
    id: id ?? newLineId(),
    kind: "catalog",
    pickLoading: false,
    selectedProduct: full,
    variantSku: first.sku,
    quantity: 1,
    unitPrice: String(listed),
    unitCost: formatCostInput(cost),
  };
}

function QtyInput({
  value,
  onChange,
  min = 1,
  max = 50,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d+$/.test(v)) setText(v);
      }}
      onBlur={() => {
        let n = parseInt(text, 10);
        if (!Number.isFinite(n) || n < min) n = min;
        if (n > max) {
          n = max;
          toast.error(`Max quantity is ${max}`);
        }
        setText(String(n));
        onChange(n);
      }}
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-300"
      aria-label="Quantity"
    />
  );
}

function CatalogLineCard({
  lineId,
  line,
  index,
  patch,
  onRemove,
  onChangeProduct,
}: {
  lineId: string;
  line: CatalogDraft;
  index: number;
  patch: (id: string, p: Partial<CatalogDraft>) => void;
  onRemove: () => void;
  onChangeProduct: () => void;
}) {
  const product = line.selectedProduct;
  if (!product) return null;

  const variant = product.variants.find((v) => v.sku === line.variantSku);
  const variantLabel =
    variant ?
      [variant.size, variant.color].filter(Boolean).join(" · ") || variant.sku
    : line.variantSku;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200/80">
          {product.images[0]?.url ?
            <Image src={product.images[0].url} alt="" fill className="object-cover" sizes="56px" />
          : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                Item {index + 1} · Catalog
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              {variantLabel ?
                <p className="text-xs text-gray-500 truncate">{variantLabel}</p>
              : null}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onChangeProduct}
            className="mt-1 text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            Change product
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs text-gray-500">
            Variant
            {product.variants.length > 1 ? ` (${product.variants.length} options)` : ""}
          </span>
          {line.pickLoading ?
            <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
              Loading variants…
            </div>
          : product.variants.length === 0 ?
            <div className="flex h-11 items-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm text-amber-800">
              No variants on this product
            </div>
          : <select
              value={line.variantSku}
              onChange={(e) => {
                const sku = e.target.value;
                const v = product.variants.find((x) => x.sku === sku);
                const listed =
                  v && typeof v.price === "number" && v.price >= 0 ? v.price : product.price;
                const cost = variantCostFromProduct(product, sku);
                patch(lineId, {
                  variantSku: sku,
                  unitPrice: String(listed),
                  unitCost: formatCostInput(cost),
                });
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {product.variants.map((v) => {
                const label = [v.size, v.color].filter(Boolean).join(" · ") || "Default";
                return (
                  <option key={v.sku} value={v.sku}>
                    {label} — stock {v.stock}
                  </option>
                );
              })}
            </select>
          }
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-gray-500">Quantity (1–50)</span>
          <QtyInput
            value={line.quantity}
            onChange={(n) => patch(lineId, { quantity: n })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-gray-500">Selling price (₹)</span>
          <input
            value={line.unitPrice}
            onChange={(e) => patch(lineId, { unitPrice: e.target.value })}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs text-gray-500">Cost of goods — COGS (₹) · per unit</span>
          <input
            value={line.unitCost}
            onChange={(e) => patch(lineId, { unitCost: e.target.value })}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Purchase cost per unit"
          />
        </label>
      </div>
      <LineProfitHint line={line} />
    </div>
  );
}

function ManualLineEditor({
  lineId,
  line,
  patch,
  shopCategories,
  categoriesLoading,
  onRemove,
  canRemove,
}: {
  lineId: string;
  line: ManualDraft;
  patch: (id: string, p: Partial<ManualDraft>) => void;
  shopCategories: Category[];
  categoriesLoading: boolean;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const selectedCategory =
    line.categorySelect && line.categorySelect !== OTHER_CATEGORY_VALUE ?
      shopCategories.find((c) => c._id === line.categorySelect)
    : null;
  const previewLabel =
    line.categorySelect === OTHER_CATEGORY_VALUE ?
      line.customTitle.trim() || "Custom line"
    : selectedCategory?.name || "Category line";

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className='text-xs text-gray-600'>Category</span>
        <select
          value={line.categorySelect}
          onChange={(e) => {
            const v = e.target.value;
            patch(lineId, {
              categorySelect: v,
              ...(v !== OTHER_CATEGORY_VALUE ? { customTitle: "" } : {}),
            });
          }}
          disabled={categoriesLoading}
          className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-60'
        >
          <option value=''>
            {categoriesLoading ? "Loading…" : "Choose category…"}
          </option>
          {shopCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
          <option value={OTHER_CATEGORY_VALUE}>
            Other — custom description
          </option>
        </select>
      </label>
      {(line.categorySelect || line.customTitle.trim()) && (
        <div className='flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5'>
          {selectedCategory?.image ?
            <OrderLineThumbnail
              image={selectedCategory.image}
              name={previewLabel}
              isOfflineManual
              className='h-11 w-11 rounded-lg'
              sizes='44px'
            />
          : <OfflineLinePlaceholderThumbnail
              className='h-11 w-11 rounded-lg'
              sizes='44px'
            />
          }
          <div className='min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>{previewLabel}</p>
            <p className='text-[11px] text-gray-500'>
              {selectedCategory?.image ?
                'Category photo on order'
              : 'Fashion placeholder on order (no category photo)'}
            </p>
          </div>
        </div>
      )}
      {line.categorySelect === OTHER_CATEGORY_VALUE && (
        <label className='block space-y-1.5'>
          <span className='text-xs text-gray-600'>Custom description</span>
          <input
            value={line.customTitle}
            onChange={(e) => patch(lineId, { customTitle: e.target.value })}
            className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            placeholder='Appears as the line name on the order'
          />
        </label>
      )}
      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='block space-y-1.5'>
          <span className='text-xs text-gray-500'>Quantity (1–50)</span>
          <QtyInput
            value={line.quantity}
            onChange={(n) => patch(lineId, { quantity: n })}
          />
        </label>
        <label className='block space-y-1.5'>
          <span className='text-xs text-gray-500'>Selling price (₹)</span>
          <input
            value={line.unitPrice}
            onChange={(e) => patch(lineId, { unitPrice: e.target.value })}
            className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            placeholder='0'
          />
        </label>
        <label className='block space-y-1.5 sm:col-span-2'>
          <span className='text-xs text-gray-500'>Cost of goods — COGS (₹)</span>
          <input
            value={line.unitCost}
            onChange={(e) => patch(lineId, { unitCost: e.target.value })}
            className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            placeholder='Purchase cost per unit'
          />
        </label>
      </div>
      <LineProfitHint line={line} />
    </div>
  );
}

export default function AdminChannelOrderClient({
  channel = "offline",
}: {
  channel?: "offline" | "b2b";
}) {
  const isB2b = channel === "b2b";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [orderSource, setOrderSource] = useState<"stall" | "personal_contact">("stall");
  const [fulfillment, setFulfillment] = useState<"delhivery" | "offline_handover">("offline_handover");
  const [paymentMethod, setPaymentMethod] = useState<"offline_upi" | "offline_cash">("offline_upi");

  const [lines, setLines] = useState<DraftLine[]>(() => []);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogHits, setCatalogHits] = useState<Product[]>([]);
  const [catalogSearchLoading, setCatalogSearchLoading] = useState(false);
  const [catalogPickLoading, setCatalogPickLoading] = useState(false);
  const [replaceCatalogLineId, setReplaceCatalogLineId] = useState<string | null>(null);
  const debouncedCatalogSearch = useDebouncedValue(catalogSearch.trim(), 320);
  const catalogSearchRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingScrollLineId = useRef<string | null>(null);
  const [shopCategories, setShopCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [shipName, setShipName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipHouse, setShipHouse] = useState("");
  const [shipStreet, setShipStreet] = useState("");
  const [shipLandmark, setShipLandmark] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipState, setShipState] = useState("");
  const [shipPin, setShipPin] = useState("");

  const [notes, setNotes] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    let cancelled = false;
    categoryApi
      .getAll({ active: true })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.categories;
        const list = Array.isArray(raw) ? raw.filter(isShopCatalogCategory) : [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        setShopCategories(list);
      })
      .catch(() => {
        if (!cancelled) setShopCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const patchCatalog = useCallback((id: string, p: Partial<CatalogDraft>) => {
    setLines((prev) => prev.map((l) => (l.id === id && l.kind === "catalog" ? { ...l, ...p } : l)));
  }, []);

  const patchManual = useCallback((id: string, p: Partial<ManualDraft>) => {
    setLines((prev) => prev.map((l) => (l.id === id && l.kind === "manual" ? { ...l, ...p } : l)));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setReplaceCatalogLineId((cur) => (cur === id ? null : cur));
  }, []);

  useEffect(() => {
    const q = debouncedCatalogSearch;
    if (!q || q.length < 2) {
      setCatalogHits([]);
      setCatalogSearchLoading(false);
      return;
    }
    let cancelled = false;
    setCatalogSearchLoading(true);
    adminApi
      .searchProducts({ q, limit: 14, page: 1, isActive: "true" })
      .then((res) => {
        if (cancelled) return;
        setCatalogHits(res.data.products);
        setCatalogSearchLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogHits([]);
          setCatalogSearchLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCatalogSearch]);

  const setLineRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) lineRefs.current.set(id, el);
    else lineRefs.current.delete(id);
  }, []);

  const scrollToLine = useCallback((lineId: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = lineRefs.current.get(lineId);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      });
    });
  }, []);

  const scrollToCatalogSearch = useCallback(() => {
    window.requestAnimationFrame(() => {
      catalogSearchRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    });
  }, []);

  useEffect(() => {
    const id = pendingScrollLineId.current;
    if (!id) return;
    if (!lines.some((l) => l.id === id)) return;
    pendingScrollLineId.current = null;
    scrollToLine(id);
  }, [lines, scrollToLine]);

  useEffect(() => {
    if (currentStep === 3) {
      scrollToCatalogSearch();
    }
  }, [currentStep, scrollToCatalogSearch]);

  const pickCatalogProduct = useCallback(
    async (p: Product) => {
      setCatalogSearch("");
      setCatalogHits([]);
      setCatalogPickLoading(true);
      try {
        const res = await adminApi.getProductById(p._id);
        const full = res.data.product as Product;
        const built = buildCatalogLineFromProduct(full);
        if (!built) {
          toast.error("This product has no variants.");
          return;
        }
        if (replaceCatalogLineId) {
          setLines((prev) =>
            prev.map((l) =>
              l.id === replaceCatalogLineId && l.kind === "catalog" ?
                { ...built, id: replaceCatalogLineId }
              : l,
            ),
          );
          pendingScrollLineId.current = replaceCatalogLineId;
          setReplaceCatalogLineId(null);
        } else {
          setLines((prev) => [...prev, built]);
          pendingScrollLineId.current = built.id;
        }
      } catch {
        toast.error("Could not load product variants.");
      } finally {
        setCatalogPickLoading(false);
      }
    },
    [replaceCatalogLineId],
  );

  const addManualLine = useCallback(() => {
    const draft = emptyManualDraft();
    pendingScrollLineId.current = draft.id;
    setLines((prev) => [...prev, draft]);
  }, []);

  const step3Subtotal = lines.reduce((sum, line) => {
    const up = lineUnitPrice(line);
    if (!Number.isFinite(up)) return sum;
    return sum + up * lineQty(line);
  }, 0);

  const handleNext = () => {
    if (currentStep === 1) {
      if (customerName.trim().length < 2) return toast.error("Enter customer name");
      if (email.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())) {
        return toast.error("Enter a valid email");
      }
      if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) {
        return toast.error("Enter a valid 10-digit mobile number");
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (fulfillment === "delhivery") {
        const pin = shipPin.replace(/\D/g, "").slice(0, 6);
        if (!shipStreet.trim() || !shipCity.trim() || !shipState.trim() || !/^\d{6}$/.test(pin)) {
          return toast.error("Complete shipping address for Delhivery (street, city, state, 6-digit PIN)");
        }
        const customerPh = phone.replace(/\D/g, "").slice(-10);
        const shipPh = shipPhone.replace(/\D/g, "").slice(-10);
        const effectivePh = /^[6-9]\d{9}$/.test(shipPh) ? shipPh
          : /^[6-9]\d{9}$/.test(customerPh) ? customerPh
          : "";
        if (!effectivePh) {
          return toast.error("Add a valid 10-digit phone (customer or shipping) for Delhivery");
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (lines.length === 0) {
        return toast.error("Add at least one product line");
      }
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.kind === "catalog") {
          if (line.pickLoading) return toast.error(`Line ${i + 1}: still loading variants`);
          if (!line.selectedProduct?._id || !line.variantSku) {
            return toast.error(`Line ${i + 1}: select a product and variant`);
          }
          const up = lineUnitPrice(line);
          if (!Number.isFinite(up)) return toast.error(`Line ${i + 1}: enter a valid unit price`);
        } else {
          const up = lineUnitPrice(line);
          if (!Number.isFinite(up)) return toast.error(`Line ${i + 1}: enter a valid unit price`);
          if (!line.categorySelect) return toast.error(`Line ${i + 1}: choose a category or Other`);
          if (line.categorySelect === OTHER_CATEGORY_VALUE && !line.customTitle.trim()) {
            return toast.error(`Line ${i + 1}: enter a custom description for Other`);
          }
        }
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const reviewSubtotal = lines.reduce((sum, line) => {
    const up = lineUnitPrice(line);
    if (!Number.isFinite(up)) return sum;
    return sum + up * lineQty(line);
  }, 0);

  const reviewCogs = lines.reduce((sum, line) => {
    const uc = lineUnitCost(line);
    if (!Number.isFinite(uc)) return sum;
    return sum + uc * lineQty(line);
  }, 0);

  const reviewProfit = reviewSubtotal - reviewCogs;
  const reviewLinesMissingCost = lines.filter(
    (line) => !Number.isFinite(lineUnitCost(line)) || lineUnitCost(line) <= 0,
  ).length;

  const buildPayload = useCallback((): AdminCreateOfflineOrderBody | AdminCreateB2bOrderBody | null => {
    const name = customerName.trim();
    if (name.length < 2) {
      toast.error("Enter customer name");
      return null;
    }
    const em = email.trim().toLowerCase();
    const ph = phone.replace(/\D/g, "").slice(-10);

    const lineItems: AdminCreateOfflineOrderBody["lineItems"] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const q = lineQty(line);
      const up = lineUnitPrice(line);
      if (!Number.isFinite(up)) {
        toast.error(`Line ${i + 1}: enter a valid unit price`);
        return null;
      }
      const uc = lineUnitCost(line);
      const costPayload = Number.isFinite(uc) ? uc : 0;
      if (line.kind === "catalog") {
        if (line.pickLoading) {
          toast.error(`Line ${i + 1}: still loading variants`);
          return null;
        }
        if (!line.selectedProduct?._id || !line.variantSku) {
          toast.error(`Line ${i + 1}: select a product and variant`);
          return null;
        }
        lineItems.push({
          type: "catalog",
          productId: line.selectedProduct._id,
          variantSku: line.variantSku,
          quantity: q,
          unitPrice: up,
          unitCost: costPayload,
        });
      } else {
        if (!line.categorySelect) {
          toast.error(`Line ${i + 1}: choose a category or Other`);
          return null;
        }
        if (line.categorySelect === OTHER_CATEGORY_VALUE) {
          const title = line.customTitle.trim();
          if (!title) {
            toast.error(`Line ${i + 1}: enter a custom description for Other`);
            return null;
          }
          lineItems.push({
            type: "manual",
            title,
            quantity: q,
            unitPrice: up,
            unitCost: costPayload,
          });
        } else {
          lineItems.push({
            type: "manual",
            categoryId: line.categorySelect,
            quantity: q,
            unitPrice: up,
            unitCost: costPayload,
          });
        }
      }
    }

    if (lineItems.length === 0) {
      toast.error("Add at least one product line");
      return null;
    }

    let shippingAddress: AdminCreateOfflineOrderBody["shippingAddress"];
    if (fulfillment === "delhivery") {
      const pin = shipPin.replace(/\D/g, "").slice(0, 6);
      if (!shipStreet.trim() || !shipCity.trim() || !shipState.trim() || !/^\d{6}$/.test(pin)) {
        toast.error("Complete shipping address for Delhivery");
        return null;
      }
      const shipPh = shipPhone.replace(/\D/g, "").slice(-10);
      const effectivePh =
        /^[6-9]\d{9}$/.test(shipPh) ? shipPh
        : /^[6-9]\d{9}$/.test(ph) ? ph
        : "";
      if (!effectivePh) {
        toast.error("Add a valid 10-digit phone for Delhivery shipping");
        return null;
      }
      shippingAddress = {
        name: shipName.trim() || name,
        phone: effectivePh,
        house: shipHouse.trim() || undefined,
        street: shipStreet.trim(),
        landmark: shipLandmark.trim() || undefined,
        city: shipCity.trim(),
        state: shipState.trim(),
        pincode: pin,
        country: "India",
      };
    }

    return {
      customerName: name,
      ...(em ? { email: em } : {}),
      ...(ph && ph.length === 10 && /^[6-9]\d{9}$/.test(ph) ? { phone: ph } : {}),
      ...(isB2b ?
        { orderSource: 'b2b' as const }
      : { orderSource }),
      fulfillment,
      paymentMethod,
      lineItems,
      ...(shippingAddress ? { shippingAddress } : {}),
      ...(notes.trim() ? { notes: notes.trim().slice(0, 2000) } : {}),
      ...(isB2b ?
        {
          b2bMeta: {
            ...(companyName.trim() ? { companyName: companyName.trim().slice(0, 120) } : {}),
            ...(gstin.trim() ? { gstin: gstin.trim().toUpperCase().slice(0, 20) } : {}),
            ...(poNumber.trim() ? { poNumber: poNumber.trim().slice(0, 60) } : {}),
          },
        }
      : {}),
    };
  }, [
    customerName,
    email,
    phone,
    lines,
    fulfillment,
    shipPin,
    shipStreet,
    shipCity,
    shipState,
    shipName,
    shipPhone,
    shipHouse,
    shipLandmark,
    orderSource,
    paymentMethod,
    notes,
    isB2b,
    companyName,
    gstin,
    poNumber,
  ]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!paymentMethod) {
      toast.error("Select a payment method");
      return;
    }
    const body = buildPayload();
    if (!body) return;
    setSubmitting(true);
    try {
      const res = isB2b ?
        await adminApi.createB2bOrder(body as AdminCreateB2bOrderBody)
      : await adminApi.createOfflineOrder(body as AdminCreateOfflineOrderBody);
      const order = res.data?.order as { _id?: string; id?: string } | undefined;
      const id = order?._id || order?.id;
      toast.success(isB2b ? "B2B order created — stock updated" : "Offline order created — confirmed & paid");
      if (id) {
        router.push(
          `/admin/orders/${encodeURIComponent(String(id))}${isB2b ? "?newB2b=1" : ""}`,
        );
      } else router.push("/admin/orders");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg && msg !== "Something went wrong" ? msg : "Could not create order. Check stock, phone, and line items.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: "Customer", icon: UserRound },
    { id: 2, title: "Fulfillment", icon: Truck },
    { id: 3, title: "Products", icon: PackageSearch },
    { id: 4, title: "Payment", icon: Wallet },
  ];

  return (
    <div className='mx-auto max-w-4xl space-y-2 p-4 sm:p-6 xl:p-8'>
      {/* Premium header */}
      <div className='hidden sm:block relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#14192f] to-slate-800 p-5 shadow-xl'>
        <div className='pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-500/10 blur-3xl' />
        <div className='relative flex flex-wrap items-center justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <Link href='/admin/orders' className='inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors'>
                <ArrowLeft className='h-3.5 w-3.5' /> Orders
              </Link>
            </div>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/10'>
                <HandIcon className='h-4 w-4 text-white' />
              </span>
              <h1 className='text-xl font-serif font-bold text-white'>
                {isB2b ? "B2B Order" : "Offline Order"}
              </h1>
              <span className='rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70'>
                {isB2b ? "Wholesale" : "POS"}
              </span>
            </div>
            <p className='text-sm text-slate-400 mt-1'>
              {isB2b ?
                "Store catalog sale for wholesale buyers — stock, soldCount & analytics update automatically."
              : "Record stall or personal-contact sales step-by-step."}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className='px-1 pt-2 pb-1'>
        <div className='relative flex items-start justify-between'>
          <div
            className='pointer-events-none absolute left-5 right-5 top-5 h-0.5 -translate-y-1/2 rounded-full bg-gray-200'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute left-5 top-5 h-0.5 -translate-y-1/2 rounded-full bg-brand-500 transition-all duration-500 ease-out'
            style={{
              width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 0px)`,
              maxWidth: "calc(100% - 2.5rem)",
            }}
            aria-hidden
          />
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className='relative z-10 flex w-16 flex-col items-center gap-1.5 sm:w-20'>
                <button
                  type='button'
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${step.title}${isActive ? " (current)" : isCompleted ? " (done)" : ""}`}
                  onClick={() => {
                    if (isCompleted || isActive) setCurrentStep(step.id);
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isActive &&
                      "border-brand-600 bg-brand-600 text-white shadow-md ring-4 ring-brand-100 scale-105",
                    isCompleted &&
                      !isActive &&
                      "border-brand-500 bg-brand-500 text-white",
                    !isActive &&
                      !isCompleted &&
                      "border-gray-200 bg-white text-gray-400",
                  )}
                >
                  {isCompleted && !isActive ?
                    <Check className='h-4 w-4' strokeWidth={2.5} />
                  : <Icon className='h-4 w-4' />}
                </button>
                <span
                  className={cn(
                    "text-center text-[10px] font-bold uppercase tracking-wider sm:text-[11px]",
                    isActive ? "text-brand-700" : isCompleted ? "text-gray-800" : "text-gray-400",
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {/* Step 1 */}
        <div className={cn(currentStep === 1 ? "block" : "hidden")}>
          <section className='space-y-6 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm'>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
              <div className='grid gap-2 sm:grid-cols-2'>
                <label className='block space-y-1.5 sm:col-span-2'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Full name <span className="text-red-500">*</span></span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                    placeholder='e.g. Priya Sharma'
                  />
                </label>
                <label className='block space-y-1.5'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Email (Optional)</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                    placeholder='customer@email.com'
                  />
                </label>
                <label className='block space-y-1.5'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Phone (Optional)</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                    placeholder='10-digit mobile'
                  />
                </label>
              </div>
              {isB2b ?
                <div className='grid gap-2 sm:grid-cols-2 pt-2 border-t border-gray-100'>
                  <label className='block space-y-1.5 sm:col-span-2'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Company / buyer name</span>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                      placeholder='e.g. Mehta Textiles Pvt Ltd'
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>GSTIN (optional)</span>
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300'
                      placeholder='22AAAAA0000A1Z5'
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>PO number (optional)</span>
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                      placeholder='Purchase order ref'
                    />
                  </label>
                </div>
              : null}
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="brand" onClick={handleNext} className="w-32 rounded-xl shadow-lg">Next →</Button>
            </div>
          </section>
        </div>

        {/* Step 2 */}
        <div className={cn(currentStep === 2 ? "block" : "hidden")}>
          <section className='space-y-6 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm'>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Context & Fulfillment</h2>
              
              <div className="space-y-3">
                {!isB2b ?
                  <>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Order source</p>
                <div className='flex gap-3'>
                  <button
                    type='button'
                    onClick={() => setOrderSource("stall")}
                    className={cn(
                      pill, "flex-1 py-3 justify-center text-center text-sm",
                      orderSource === "stall" ? "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <Store className='mr-1.5 mb-0.5 inline h-4 w-4 opacity-80' />
                    Stall / POS
                  </button>
                  <button
                    type='button'
                    onClick={() => setOrderSource("personal_contact")}
                    className={cn(
                      pill, "flex-1 py-3 justify-center text-center text-sm",
                      orderSource === "personal_contact" ? "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <UserRound className='mr-1.5 mb-0.5 inline h-4 w-4 opacity-80' />
                    Personal contact
                  </button>
                </div>
                  </>
                : (
                  <p className='text-sm text-violet-800 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3'>
                    B2B wholesale order — catalog lines reduce store inventory and appear under B2B in analytics.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Fulfillment Method</p>
                <div className='flex gap-3'>
                  <button
                    type='button'
                    onClick={() => setFulfillment("delhivery")}
                    className={cn(
                      pill, "flex-1 py-3 flex flex-col items-center justify-center gap-1.5",
                      fulfillment === "delhivery" ? "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <Truck className='h-5 w-5 opacity-80' />
                    <span className="text-xs sm:text-sm">Delhivery</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setFulfillment("offline_handover")}
                    className={cn(
                      pill, "flex-1 py-3 flex flex-col items-center justify-center gap-1.5",
                      fulfillment === "offline_handover" ? "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <HandIcon className='h-5 w-5 opacity-80' />
                    <span className="text-xs sm:text-sm">Handover</span>
                  </button>
                </div>
              </div>
            </div>

            {fulfillment === "delhivery" && (
              <div className='space-y-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5 mt-6 animate-in fade-in slide-in-from-top-2'>
                <div className='flex items-start gap-2 text-sm text-amber-900 font-medium pb-2 border-b border-amber-100/50'>
                  <MapPin className='mt-0.5 h-4 w-4 shrink-0' />
                  <p>Shipping Details for Delhivery Integration</p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label className='block space-y-1.5'>
                    <span className='text-xs text-gray-600 font-semibold'>Recipient name</span>
                    <input value={shipName} onChange={(e) => setShipName(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' placeholder='Defaults to customer name' />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-xs text-gray-600 font-semibold'>Phone</span>
                    <input value={shipPhone} onChange={(e) => setShipPhone(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' placeholder='10-digit' />
                  </label>
                  <label className='block space-y-1.5 sm:col-span-2'>
                    <span className='text-xs text-gray-600 font-semibold'>Flat / house (optional)</span>
                    <input value={shipHouse} onChange={(e) => setShipHouse(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' />
                  </label>
                  <label className='block space-y-1.5 sm:col-span-2'>
                    <span className='text-xs text-gray-600 font-semibold'>Street / area <span className="text-red-500">*</span></span>
                    <input value={shipStreet} onChange={(e) => setShipStreet(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' />
                  </label>
                  <label className='block space-y-1.5 sm:col-span-2'>
                    <span className='text-xs text-gray-600 font-semibold'>Landmark (optional)</span>
                    <input value={shipLandmark} onChange={(e) => setShipLandmark(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-xs text-gray-600 font-semibold'>City <span className="text-red-500">*</span></span>
                    <input value={shipCity} onChange={(e) => setShipCity(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-xs text-gray-600 font-semibold'>State <span className="text-red-500">*</span></span>
                    <input value={shipState} onChange={(e) => setShipState(e.target.value)} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm' />
                  </label>
                  <label className='block space-y-1.5 sm:col-span-2'>
                    <span className='text-xs text-gray-600 font-semibold'>PIN code <span className="text-red-500">*</span></span>
                    <input value={shipPin} onChange={(e) => setShipPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm tracking-widest' placeholder='6 digits' />
                  </label>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleBack} className="w-24 rounded-xl shadow-sm">← Back</Button>
              <Button type="button" variant="brand" onClick={handleNext} className="w-32 rounded-xl shadow-lg">Next →</Button>
            </div>
          </section>
        </div>

        {/* Step 3 */}
        <div className={cn(currentStep === 3 ? "block" : "hidden")}>
          <section className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-visible'>
            {/* Sticky search + summary */}
            <div className='sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6 space-y-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Products &amp; prices</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Search once at top — pick product, set qty &amp; price on the line below.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm shrink-0">
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 tabular-nums">
                    {lines.length} item{lines.length === 1 ? "" : "s"}
                  </span>
                  {lines.length > 0 ?
                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 tabular-nums">
                      {formatPrice(step3Subtotal)}
                    </span>
                  : null}
                </div>
              </div>

            <div ref={catalogSearchRef} className="relative z-50 scroll-mt-4">
                {replaceCatalogLineId ?
                  <p className="mb-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Replacing item — pick a new product from search, or{" "}
                    <button
                      type="button"
                      className="underline font-semibold"
                      onClick={() => setReplaceCatalogLineId(null)}
                    >
                      cancel
                    </button>
                  </p>
                : null}
                <SearchField
                  value={catalogSearch}
                  onChange={setCatalogSearch}
                  placeholder="Search catalog product to add…"
                  className="w-full"
                  isLoading={catalogSearchLoading || catalogPickLoading}
                />
                {catalogHits.length > 0 ?
                  <ul
                    role="listbox"
                    className={cn(
                      "absolute z-[200] mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5",
                      hideScrollbarCls,
                    )}
                  >
                    {catalogHits.map((p) => (
                      <li key={p._id}>
                        <button
                          type="button"
                          role="option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickCatalogProduct(p)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50/60"
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {p.images[0]?.url ?
                              <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="44px" />
                            : null}
                          </div>
                          <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{p.name}</span>
                          <span className="shrink-0 text-xs text-gray-500">{formatPrice(p.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addManualLine}>
                  <Plus className="mr-1.5 h-4 w-4" /> Custom category line
                </Button>
              </div>
            </div>

            {/* Line items */}
            <div className={cn("px-4 py-4 sm:px-6 space-y-3 min-h-[120px]", hideScrollbarCls)}>
              {lines.length === 0 ?
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
                  <PackageSearch className="h-9 w-9 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">No items yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Type a product name in the search above, or add a custom category line for non-catalog items.
                  </p>
                </div>
              : lines.map((line, idx) => (
                  <div
                    key={line.id}
                    ref={(el) => setLineRef(line.id, el)}
                    className="scroll-mt-36 scroll-mb-32"
                  >
                    {line.kind === "catalog" ?
                      line.selectedProduct ?
                        <CatalogLineCard
                          lineId={line.id}
                          line={line}
                          index={idx}
                          patch={patchCatalog}
                          onRemove={() => removeLine(line.id)}
                          onChangeProduct={() => {
                            setReplaceCatalogLineId(line.id);
                            scrollToCatalogSearch();
                            toast("Search above to replace this product", { icon: "↩️" });
                          }}
                        />
                      : null
                    : <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                            Item {idx + 1} · Custom
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <ManualLineEditor
                          lineId={line.id}
                          line={line}
                          patch={patchManual}
                          shopCategories={shopCategories}
                          categoriesLoading={categoriesLoading}
                          onRemove={() => removeLine(line.id)}
                          canRemove={false}
                        />
                      </div>
                    }
                  </div>
                ))
              }
            </div>

            <div className="sticky bottom-0 z-30 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-6">
              <Button type="button" variant="outline" onClick={handleBack} className="w-24 rounded-xl shadow-sm">
                ← Back
              </Button>
              <div className="hidden sm:block text-xs text-gray-500 tabular-nums">
                {lines.length > 0 ? `${lines.length} items · ${formatPrice(step3Subtotal)}` : "Add items to continue"}
              </div>
              <Button type="button" variant="brand" onClick={handleNext} className="w-32 rounded-xl shadow-lg">
                Next →
              </Button>
            </div>
          </section>
        </div>

        {/* Step 4 */}
        <div className={cn(currentStep === 4 ? "block" : "hidden")}>
          <section className='space-y-5 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm'>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>Payment &amp; confirm</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Choose how the customer paid, review the order, then create it.
              </p>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Payment method <span className='text-red-500'>*</span>
              </p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <button
                  type='button'
                  onClick={() => setPaymentMethod("offline_upi")}
                  aria-pressed={paymentMethod === "offline_upi"}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all",
                    paymentMethod === "offline_upi"
                      ? "border-brand-600 bg-brand-50 shadow-sm ring-2 ring-brand-100"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      paymentMethod === "offline_upi" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <Smartphone className='h-5 w-5' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-bold text-gray-900'>UPI</span>
                    <span className='block text-xs text-gray-500'>Paid at sale via UPI</span>
                  </span>
                  {paymentMethod === "offline_upi" ?
                    <Check className='h-5 w-5 shrink-0 text-brand-600' strokeWidth={2.5} />
                  : null}
                </button>
                <button
                  type='button'
                  onClick={() => setPaymentMethod("offline_cash")}
                  aria-pressed={paymentMethod === "offline_cash"}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all",
                    paymentMethod === "offline_cash"
                      ? "border-brand-600 bg-brand-50 shadow-sm ring-2 ring-brand-100"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      paymentMethod === "offline_cash" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <Banknote className='h-5 w-5' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-bold text-gray-900'>Cash</span>
                    <span className='block text-xs text-gray-500'>Paid at sale in cash</span>
                  </span>
                  {paymentMethod === "offline_cash" ?
                    <Check className='h-5 w-5 shrink-0 text-brand-600' strokeWidth={2.5} />
                  : null}
                </button>
              </div>
            </div>

            <label className='block space-y-1.5'>
              <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Internal notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className='w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                placeholder='Reference for your team...'
              />
            </label>

            <div className='rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3'>
              <h3 className='text-sm font-bold text-gray-900'>Order summary</h3>
              <ul className='space-y-2 text-sm'>
                <li className='flex justify-between gap-3'>
                  <span className='text-gray-500'>Customer</span>
                  <span className='font-medium text-gray-900 text-right'>{customerName || "—"}</span>
                </li>
                <li className='flex justify-between gap-3'>
                  <span className='text-gray-500'>Source</span>
                  <span className='font-medium text-gray-900'>
                    {isB2b ? "B2B wholesale"
                    : orderSource === "stall" ? "Stall / POS"
                    : "Personal"}
                  </span>
                </li>
                <li className='flex justify-between gap-3'>
                  <span className='text-gray-500'>Fulfillment</span>
                  <span className='font-medium text-gray-900'>
                    {fulfillment === "delhivery" ? "Delhivery" : "In-person handover"}
                  </span>
                </li>
                <li className='flex justify-between gap-3'>
                  <span className='text-gray-500'>Payment</span>
                  <span className='font-medium text-gray-900'>
                    {paymentMethod === "offline_upi" ? "UPI" : "Cash"}
                  </span>
                </li>
              </ul>

              <div className='border-t border-gray-200 pt-3 space-y-2'>
                {lines.map((line, idx) => {
                  const up = lineUnitPrice(line);
                  const uc = lineUnitCost(line);
                  const q = lineQty(line);
                  const revenue = Number.isFinite(up) ? up * q : 0;
                  const cogs = Number.isFinite(uc) ? uc * q : 0;
                  const profit = revenue - cogs;
                  return (
                    <div key={line.id} className='space-y-0.5 text-sm'>
                      <div className='flex justify-between gap-3'>
                        <span className='min-w-0 text-gray-600'>
                          <span className='text-gray-400'>#{idx + 1}</span>{" "}
                          {lineLabel(line, shopCategories)}
                          <span className='text-gray-400'> × {q}</span>
                        </span>
                        <span className='shrink-0 font-medium text-gray-900'>
                          {Number.isFinite(up) ? formatPrice(revenue) : "—"}
                        </span>
                      </div>
                      <div className='flex justify-between gap-3 text-[11px] text-gray-500 pl-4'>
                        <span>COGS</span>
                        <span className='tabular-nums'>
                          {Number.isFinite(uc) ? formatPrice(cogs) : "—"}
                        </span>
                      </div>
                      <div className='flex justify-between gap-3 text-[11px] pl-4'>
                        <span className='text-emerald-700'>Line profit</span>
                        <span className='tabular-nums font-medium text-emerald-800'>
                          {Number.isFinite(up) && Number.isFinite(uc) ?
                            formatPrice(profit)
                          : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='space-y-1.5 border-t border-gray-200 pt-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold text-gray-900'>Total revenue</span>
                  <span className='text-lg font-bold text-brand-700 tabular-nums'>
                    {formatPrice(reviewSubtotal)}
                  </span>
                </div>
                <div className='flex items-center justify-between text-gray-600'>
                  <span>Total COGS</span>
                  <span className='font-medium tabular-nums'>{formatPrice(reviewCogs)}</span>
                </div>
                <div className='flex items-center justify-between text-emerald-800'>
                  <span className='font-semibold'>Gross profit</span>
                  <span className='font-bold tabular-nums'>{formatPrice(reviewProfit)}</span>
                </div>
              </div>
              {reviewLinesMissingCost > 0 ?
                <p className='text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>
                  {reviewLinesMissingCost} line{reviewLinesMissingCost > 1 ? "s" : ""} have no
                  cost of goods — profit may be overstated on the revenue page.
                </p>
              : null}
              <p className='text-[11px] text-gray-500'>
                Order will be saved as <strong>confirmed &amp; paid</strong>
                {fulfillment === "offline_handover" ? " and marked delivered" : ""}.
              </p>
            </div>

            <div className='sticky bottom-0 -mx-5 sm:-mx-6 border-t border-gray-100 bg-white/95 px-5 sm:px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/90'>
              <div className='flex items-center justify-between gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleBack}
                  disabled={submitting}
                  className='w-24 rounded-xl shadow-sm'
                >
                  ← Back
                </Button>
                <Button
                  type='button'
                  variant='brand'
                  className='min-w-[160px] rounded-xl font-bold shadow-lg'
                  loading={submitting}
                  disabled={!paymentMethod || reviewSubtotal < 0}
                  onClick={() => void handleSubmit()}
                >
                  Create order
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
