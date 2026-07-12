"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  HandIcon,
  MapPin,
  PackageSearch,
  PenLine,
  Plus,
  Store,
  Trash2,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { adminApi, productApi, categoryApi } from "@/lib/api";
import type { AdminCreateOfflineOrderBody, Category, Product } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/SearchField";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import toast from "react-hot-toast";

const OTHER_CATEGORY_VALUE = "__other__";

const pill =
  "rounded-xl border px-3 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

export type CatalogDraft = {
  id: string;
  kind: "catalog";
  productSearch: string;
  searchHits: Product[];
  searchLoading: boolean;
  selectedProduct: Product | null;
  variantSku: string;
  quantity: number;
  unitPrice: string;
};

export type ManualDraft = {
  id: string;
  kind: "manual";
  categorySelect: string;
  customTitle: string;
  quantity: number;
  unitPrice: string;
};

export type DraftLine = CatalogDraft | ManualDraft;

function newLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ?
      crypto.randomUUID()
    : `ln_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function catalogWithId(id: string): CatalogDraft {
  return {
    id,
    kind: "catalog",
    productSearch: "",
    searchHits: [],
    searchLoading: false,
    selectedProduct: null,
    variantSku: "",
    quantity: 1,
    unitPrice: "",
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
  };
}

function emptyCatalogDraft(): CatalogDraft {
  return catalogWithId(newLineId());
}

function emptyManualDraft(): ManualDraft {
  return manualWithId(newLineId());
}

function CatalogLineEditor({
  lineId,
  line,
  patch,
  onRemove,
  canRemove,
}: {
  lineId: string;
  line: CatalogDraft;
  patch: (id: string, p: Partial<CatalogDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const debouncedSearch = useDebouncedValue(line.productSearch.trim(), 320);
  const selectedNameRef = useRef<string | undefined>(undefined);
  selectedNameRef.current = line.selectedProduct?.name;

  useEffect(() => {
    const d = debouncedSearch;
    if (!d) {
      patch(lineId, { searchHits: [], searchLoading: false });
      return;
    }
    const sn = selectedNameRef.current;
    if (sn && d === sn.trim()) {
      patch(lineId, { searchHits: [], searchLoading: false });
      return;
    }
    let cancelled = false;
    patch(lineId, { searchLoading: true });
    adminApi
      .searchProducts({ q: d, limit: 14, page: 1, isActive: "true" })
      .then((res) => {
        if (cancelled) return;
        patch(lineId, {
          searchHits: res.data.products,
          searchLoading: false,
        });
      })
      .catch(() => {
        if (!cancelled) patch(lineId, { searchHits: [], searchLoading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, lineId, patch]);

  const pickProduct = (p: Product) => {
    if (!p.variants?.length) {
      toast.error("This product has no variants.");
      return;
    }
    const first = p.variants[0]!;
    const listed =
      typeof first.price === "number" && first.price >= 0 ?
        first.price
      : p.price;
    patch(lineId, {
      selectedProduct: p,
      productSearch: p.name,
      searchHits: [],
      variantSku: first.sku,
      unitPrice: String(listed),
    });
  };

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
          Catalog product
        </p>
        {canRemove ?
          <button
            type='button'
            onClick={onRemove}
            className='shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600'
            aria-label='Remove line'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        : null}
      </div>
      <div className='relative z-[8]'>
        <SearchField
          value={line.productSearch}
          onChange={(v) => {
            patch(lineId, { productSearch: v });
            if (
              line.selectedProduct &&
              v.trim() !== line.selectedProduct.name.trim()
            ) {
              patch(lineId, { selectedProduct: null, variantSku: "" });
            }
          }}
          placeholder='Search products by name…'
          className='w-full'
          isLoading={line.searchLoading}
        />
        {line.searchHits.length > 0 && (
          <ul
            role='listbox'
            className='absolute z-[90] mt-1 w-full max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5'
          >
            {line.searchHits.map((p) => (
              <li key={p._id}>
                <button
                  type='button'
                  role='option'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickProduct(p)}
                  className='flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50/60'
                >
                  <div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                    {p.images[0]?.url ?
                      <Image
                        src={p.images[0].url}
                        alt=''
                        fill
                        className='object-cover'
                        sizes='44px'
                      />
                    : null}
                  </div>
                  <span className='min-w-0 flex-1 truncate font-medium text-gray-900'>
                    {p.name}
                  </span>
                  <span className='shrink-0 text-xs text-gray-500'>
                    {formatPrice(p.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {line.selectedProduct && (
        <div className='rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-3'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='block space-y-1.5 sm:col-span-2'>
              <span className='text-xs text-gray-500'>Variant (SKU)</span>
              <select
                value={line.variantSku}
                onChange={(e) => {
                  const sku = e.target.value;
                  const v = line.selectedProduct!.variants.find(
                    (x) => x.sku === sku,
                  );
                  const listed =
                    v && typeof v.price === "number" && v.price >= 0 ?
                      v.price
                    : line.selectedProduct!.price;
                  patch(lineId, { variantSku: sku, unitPrice: String(listed) });
                }}
                className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              >
                {line.selectedProduct.variants.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {[v.size, v.color].filter(Boolean).join(" · ") || "Default"}{" "}
                    — {v.sku} (stock {v.stock})
                  </option>
                ))}
              </select>
            </label>
            <label className='block space-y-1.5'>
              <span className='text-xs text-gray-500'>Quantity</span>
              <input
                type='number'
                min={1}
                max={50}
                value={line.quantity}
                onChange={(e) =>
                  patch(lineId, { quantity: Number(e.target.value) || 1 })
                }
                className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              />
            </label>
            <label className='block space-y-1.5'>
              <span className='text-xs text-gray-500'>Unit price (₹)</span>
              <input
                value={line.unitPrice}
                onChange={(e) => patch(lineId, { unitPrice: e.target.value })}
                className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              />
            </label>
          </div>
        </div>
      )}
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
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
          Shop category (or other)
        </p>
        {canRemove ?
          <button
            type='button'
            onClick={onRemove}
            className='shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600'
            aria-label='Remove line'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        : null}
      </div>
      <label className='block space-y-1.5'>
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
          <span className='text-xs text-gray-500'>Quantity</span>
          <input
            type='number'
            min={1}
            max={50}
            value={line.quantity}
            onChange={(e) =>
              patch(lineId, { quantity: Number(e.target.value) || 1 })
            }
            className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
          />
        </label>
        <label className='block space-y-1.5'>
          <span className='text-xs text-gray-500'>Unit price (₹)</span>
          <input
            value={line.unitPrice}
            onChange={(e) => patch(lineId, { unitPrice: e.target.value })}
            className='h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            placeholder='0'
          />
        </label>
      </div>
    </div>
  );
}

export default function AdminOfflineOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [orderSource, setOrderSource] = useState<"stall" | "personal_contact">("stall");
  const [fulfillment, setFulfillment] = useState<"delhivery" | "offline_handover">("offline_handover");
  const [paymentMethod, setPaymentMethod] = useState<"offline_upi" | "offline_cash">("offline_upi");

  const [lines, setLines] = useState<DraftLine[]>(() => [emptyCatalogDraft()]);
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

  const setLineKind = useCallback((id: string, kind: "catalog" | "manual") => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return kind === "catalog" ? catalogWithId(id) : manualWithId(id);
      }),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const handleNext = () => {
    if (currentStep === 1) {
      if (customerName.trim().length < 2) return toast.error("Enter customer name");
      if (email.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}$/i.test(email.trim())) return toast.error("Enter a valid email");
      if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) return toast.error("Enter a valid 10-digit mobile number");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (fulfillment === "delhivery") {
        const pin = shipPin.replace(/\D/g, "").slice(0, 6);
        if (!shipStreet.trim() || !shipCity.trim() || !shipState.trim() || !/^\d{6}$/.test(pin)) {
          return toast.error("Complete shipping address for Delhivery (street, city, state, 6-digit PIN)");
        }
        const sp = shipPhone.replace(/\D/g, "").slice(-10);
        if (shipPhone.trim() && !/^[6-9]\d{9}$/.test(sp)) {
          return toast.error("Shipping phone must be a valid 10-digit number");
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.kind === "catalog") {
          if (!line.selectedProduct?._id || !line.variantSku) return toast.error(`Line ${i + 1}: select a product and variant`);
          const up = Number(line.unitPrice);
          if (!Number.isFinite(up) || up < 0) return toast.error(`Line ${i + 1}: enter a valid unit price`);
        } else {
          const up = Number(line.unitPrice);
          if (!Number.isFinite(up) || up < 0) return toast.error(`Line ${i + 1}: enter a valid unit price`);
          if (!line.categorySelect) return toast.error(`Line ${i + 1}: choose a category or Other`);
          if (line.categorySelect === OTHER_CATEGORY_VALUE && !line.customTitle.trim()) return toast.error(`Line ${i + 1}: enter a custom description for Other`);
        }
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const buildPayload = useCallback((): AdminCreateOfflineOrderBody | null => {
    const name = customerName.trim();
    const em = email.trim().toLowerCase();
    const ph = phone.replace(/\D/g, "").slice(-10);
    
    const lineItems: AdminCreateOfflineOrderBody["lineItems"] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.kind === "catalog") {
        const q = Math.max(1, Math.min(50, Math.floor(line.quantity)));
        const up = Number(line.unitPrice);
        const v = line.selectedProduct!.variants.find((x) => x.sku === line.variantSku);
        const listed = v && typeof v.price === "number" && v.price >= 0 ? v.price : line.selectedProduct!.price;
        const out: any = {
          type: "catalog",
          productId: line.selectedProduct!._id,
          variantSku: line.variantSku,
          quantity: q,
        };
        if (Number.isFinite(listed) && Math.abs(up - listed) > 0.005) {
          out.unitPrice = up;
        }
        lineItems.push(out);
      } else {
        const up = Number(line.unitPrice);
        const q = Math.max(1, Math.min(50, Math.floor(line.quantity)));
        if (line.categorySelect === OTHER_CATEGORY_VALUE) {
          lineItems.push({ type: "manual", title: line.customTitle.trim(), quantity: q, unitPrice: up });
        } else {
          lineItems.push({ type: "manual", categoryId: line.categorySelect, quantity: q, unitPrice: up });
        }
      }
    }

    let shippingAddress: AdminCreateOfflineOrderBody["shippingAddress"];
    if (fulfillment === "delhivery") {
      const pin = shipPin.replace(/\D/g, "").slice(0, 6);
      const sp = shipPhone.replace(/\D/g, "").slice(-10);
      shippingAddress = {
        name: shipName.trim() || name,
        phone: sp || ph || undefined,
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
      ...(ph && ph.length === 10 ? { phone: ph } : {}),
      orderSource,
      fulfillment,
      paymentMethod,
      lineItems,
      ...(shippingAddress ? { shippingAddress } : {}),
      ...(notes.trim() ? { notes: notes.trim().slice(0, 2000) } : {}),
    };
  }, [customerName, email, phone, lines, fulfillment, shipPin, shipStreet, shipCity, shipState, shipName, shipPhone, shipHouse, shipLandmark, orderSource, paymentMethod, notes]);

  const handleSubmit = async () => {
    const body = buildPayload();
    if (!body) return;
    setSubmitting(true);
    try {
      const res = await adminApi.createOfflineOrder(body);
      const id = (res.data.order as { _id: string })._id;
      toast.success("Order created — confirmed & paid");
      if (id) router.push(`/admin/orders/${encodeURIComponent(id)}`);
      else router.push("/admin/orders");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Could not create order");
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
            <div className='flex items-center gap-2.5'>
              <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/10'>
                <HandIcon className='h-4 w-4 text-white' />
              </span>
              <h1 className='text-xl font-serif font-bold text-white'>Offline Order</h1>
              <span className='rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70'>POS</span>
            </div>
            <p className='text-sm text-slate-400 mt-1'>Record stall or personal-contact sales step-by-step.</p>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-gray-100 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-brand-500 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => {
                     if (isCompleted || isActive) setCurrentStep(step.id);
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isActive ? "border-brand-500 bg-brand-50 text-brand-600 scale-110 shadow-sm" : 
                    isCompleted ? "border-brand-500 bg-brand-500 text-white" : 
                    "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest transition-colors",
                  isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {/* Step 1 */}
        <div className={cn(currentStep === 1 ? "animate-in fade-in slide-in-from-right-4 duration-500" : "hidden")}>
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
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="brand" onClick={handleNext} className="w-32 rounded-xl shadow-lg">Next →</Button>
            </div>
          </section>
        </div>

        {/* Step 2 */}
        <div className={cn(currentStep === 2 ? "animate-in fade-in slide-in-from-right-4 duration-500" : "hidden")}>
          <section className='space-y-6 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm'>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Context & Fulfillment</h2>
              
              <div className="space-y-3">
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
                    <PenLine className='mr-1.5 mb-0.5 inline h-4 w-4 opacity-80' />
                    Personal
                  </button>
                </div>
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
        <div className={cn(currentStep === 3 ? "animate-in fade-in slide-in-from-right-4 duration-500" : "hidden")}>
          <section className='space-y-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 '>
              <h2 className="text-lg font-bold text-gray-900">Products &amp; Prices</h2>
              <div className='flex flex-row flex-wrap gap-2'>
                <Button type='button' variant='outline' size='sm' className='rounded-xl flex-1 sm:flex-none' onClick={() => setLines((p) => [...p, emptyCatalogDraft()])}>
                  <Plus className='mr-1.5 h-4 w-4' /> Catalog Product
                </Button>
                <Button type='button' variant='outline' size='sm' className='rounded-xl flex-1 sm:flex-none' onClick={() => setLines((p) => [...p, emptyManualDraft()])}>
                  <Plus className='mr-1.5 h-4 w-4' /> Custom Line
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              {lines.map((line, idx) => (
                <div key={line.id} className='rounded-2xl border border-gray-200 bg-gray-50/50 p-3 sm:p-4'>
                  <div className='mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <span className='text-xs font-bold uppercase tracking-wide text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md w-max'>Item {idx + 1}</span>
                    <div className='flex p-1 bg-gray-200/50 rounded-lg w-full sm:w-auto'>
                      <button type='button' onClick={() => setLineKind(line.id, "catalog")} className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all", line.kind === "catalog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Catalog</button>
                      <button type='button' onClick={() => setLineKind(line.id, "manual")} className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all", line.kind === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Category / Other</button>
                    </div>
                  </div>

                  {line.kind === "catalog" ? (
                    <CatalogLineEditor lineId={line.id} line={line} patch={patchCatalog} onRemove={() => removeLine(line.id)} canRemove={lines.length > 1} />
                  ) : (
                    <ManualLineEditor lineId={line.id} line={line} patch={patchManual} shopCategories={shopCategories} categoriesLoading={categoriesLoading} onRemove={() => removeLine(line.id)} canRemove={lines.length > 1} />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleBack} className="w-24 rounded-xl shadow-sm">← Back</Button>
              <Button type="button" variant="brand" onClick={handleNext} className="w-32 rounded-xl shadow-lg">Next →</Button>
            </div>
          </section>
        </div>

        {/* Step 4 */}
        <div className={cn(currentStep === 4 ? "animate-in fade-in slide-in-from-right-4 duration-500" : "hidden")}>
           <section className='space-y-6 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm'>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Payment &amp; Review</h2>
              <div className='flex flex-col sm:flex-row gap-3'>
                <button
                  type='button'
                  onClick={() => setPaymentMethod("offline_upi")}
                  className={cn(
                    pill, "flex-1 py-4 text-base",
                    paymentMethod === "offline_upi" ? "border-emerald-400 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200 shadow-sm" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                  )}
                >
                  💳 UPI (offline)
                </button>
                <button
                  type='button'
                  onClick={() => setPaymentMethod("offline_cash")}
                  className={cn(
                    pill, "flex-1 py-4 text-base",
                    paymentMethod === "offline_cash" ? "border-emerald-400 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200 shadow-sm" : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
                  )}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className='block space-y-1.5'>
                <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Internal notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className='w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                  placeholder='Reference for your team...'
                />
              </label>
            </div>
            
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
               <h3 className="font-semibold text-gray-900 mb-2">Order Summary Overview</h3>
               <ul className="space-y-2 text-sm text-gray-600">
                 <li className="flex justify-between"><span>Customer:</span> <span className="font-medium text-gray-900">{customerName || "—"}</span></li>
                 <li className="flex justify-between"><span>Total Items:</span> <span className="font-medium text-gray-900">{lines.length} Line(s)</span></li>
                 <li className="flex justify-between"><span>Fulfillment:</span> <span className="font-medium text-gray-900">{fulfillment === "delhivery" ? "Delhivery" : "Handover"}</span></li>
                 <li className="flex justify-between"><span>Payment:</span> <span className="font-medium text-gray-900">{paymentMethod === "offline_upi" ? "UPI" : "Cash"}</span></li>
               </ul>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleBack} disabled={submitting} className="w-24 rounded-xl shadow-sm">← Back</Button>
              <Button type='button' variant='brand' className='min-w-[150px] rounded-xl font-bold shadow-lg' loading={submitting} onClick={() => void handleSubmit()}>✓ Create Order</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
