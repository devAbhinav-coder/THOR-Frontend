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
    productApi
      .getAll({ search: d, limit: 14, page: 1 })
      .then((res) => {
        if (cancelled) return;
        patch(lineId, {
          searchHits: res.data.products.filter((p) => p.isActive),
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
      <div className='relative z-[80]'>
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

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [orderSource, setOrderSource] = useState<"stall" | "personal_contact">(
    "stall",
  );
  const [fulfillment, setFulfillment] = useState<
    "delhivery" | "offline_handover"
  >("offline_handover");
  const [paymentMethod, setPaymentMethod] = useState<
    "offline_upi" | "offline_cash"
  >("offline_upi");

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
        const list =
          Array.isArray(raw) ? raw.filter(isShopCatalogCategory) : [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        setShopCategories(list);
      })
      .catch(() => {
        if (!cancelled) setShopCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patchCatalog = useCallback((id: string, p: Partial<CatalogDraft>) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id && l.kind === "catalog" ? { ...l, ...p } : l,
      ),
    );
  }, []);

  const patchManual = useCallback((id: string, p: Partial<ManualDraft>) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id && l.kind === "manual" ? { ...l, ...p } : l,
      ),
    );
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

  const buildPayload = useCallback((): AdminCreateOfflineOrderBody | null => {
    const name = customerName.trim();
    const em = email.trim().toLowerCase();
    const ph = phone.replace(/\D/g, "").slice(-10);
    if (name.length < 2) {
      toast.error("Enter customer name");
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error("Enter a valid email");
      return null;
    }
    if (!/^[6-9]\d{9}$/.test(ph)) {
      toast.error("Enter a valid 10-digit mobile number");
      return null;
    }

    const lineItems: AdminCreateOfflineOrderBody["lineItems"] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const label = `Line ${i + 1}`;
      if (line.kind === "catalog") {
        if (!line.selectedProduct?._id || !line.variantSku) {
          toast.error(`${label}: select a product and variant`);
          return null;
        }
        const up = Number(line.unitPrice);
        if (!Number.isFinite(up) || up < 0) {
          toast.error(`${label}: enter a valid unit price`);
          return null;
        }
        const q = Math.max(1, Math.min(50, Math.floor(line.quantity)));
        const v = line.selectedProduct.variants.find(
          (x) => x.sku === line.variantSku,
        );
        const listed =
          v && typeof v.price === "number" && v.price >= 0 ?
            v.price
          : line.selectedProduct.price;
        const out: {
          type: "catalog";
          productId: string;
          variantSku: string;
          quantity: number;
          unitPrice?: number;
        } = {
          type: "catalog",
          productId: line.selectedProduct._id,
          variantSku: line.variantSku,
          quantity: q,
        };
        if (Number.isFinite(listed) && Math.abs(up - listed) > 0.005) {
          out.unitPrice = up;
        }
        lineItems.push(out);
      } else {
        const up = Number(line.unitPrice);
        if (!Number.isFinite(up) || up < 0) {
          toast.error(`${label}: enter a valid unit price`);
          return null;
        }
        const q = Math.max(1, Math.min(50, Math.floor(line.quantity)));
        if (!line.categorySelect) {
          toast.error(`${label}: choose a category or Other`);
          return null;
        }
        if (line.categorySelect === OTHER_CATEGORY_VALUE) {
          const t = line.customTitle.trim();
          if (!t) {
            toast.error(`${label}: enter a custom description for Other`);
            return null;
          }
          lineItems.push({
            type: "manual",
            title: t,
            quantity: q,
            unitPrice: up,
          });
        } else {
          lineItems.push({
            type: "manual",
            categoryId: line.categorySelect,
            quantity: q,
            unitPrice: up,
          });
        }
      }
    }

    let shippingAddress: AdminCreateOfflineOrderBody["shippingAddress"];
    if (fulfillment === "delhivery") {
      const pin = shipPin.replace(/\D/g, "").slice(0, 6);
      if (
        !shipStreet.trim() ||
        !shipCity.trim() ||
        !shipState.trim() ||
        !/^\d{6}$/.test(pin)
      ) {
        toast.error(
          "Complete shipping address for Delhivery (street, city, state, 6-digit PIN)",
        );
        return null;
      }
      const sp = shipPhone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(sp)) {
        toast.error("Shipping phone must be a valid 10-digit Indian number");
        return null;
      }
      shippingAddress = {
        name: shipName.trim() || name,
        phone: sp,
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
      email: em,
      phone: ph,
      orderSource,
      fulfillment,
      paymentMethod,
      lineItems,
      ...(shippingAddress ? { shippingAddress } : {}),
      ...(notes.trim() ? { notes: notes.trim().slice(0, 2000) } : {}),
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
  ]);

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
      toast.error(
        (err as { message?: string })?.message || "Could not create order",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='mx-auto max-w-4xl space-y-6 p-4 pb-28 sm:p-6 xl:p-8'>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          href='/admin/orders'
          className='inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-700'
        >
          <ArrowLeft className='h-4 w-4' /> Orders
        </Link>
      </div>

      <AdminPageHeader
        title='Offline order'
        description='Record stall or personal-contact sales.'
        badge='POS'
        actions={
          <Link
            href='/admin/orders'
            className='inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-brand-300 hover:bg-brand-50/50'
          >
            All orders
          </Link>
        }
      />

      {/* Customer */}
      <section className='space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex items-center gap-2 font-semibold text-gray-900'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-800'>
            1
          </span>
          <UserRound className='h-4 w-4 text-brand-600' />
          Customer
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='block space-y-1.5'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Full name
            </span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              placeholder='e.g. Priya Sharma'
              autoComplete='name'
            />
          </label>
          <label className='block space-y-1.5'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              placeholder='customer@email.com'
              autoComplete='email'
            />
          </label>
          <label className='block space-y-1.5 sm:col-span-2'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Phone
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
              placeholder='10-digit mobile'
              autoComplete='tel'
            />
          </label>
        </div>

        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
            Order source
          </p>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setOrderSource("stall")}
              className={cn(
                pill,
                orderSource === "stall" ?
                  "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
              )}
            >
              <Store className='mr-1.5 inline h-4 w-4 -mt-0.5 opacity-80' />
              Stall
            </button>
            <button
              type='button'
              onClick={() => setOrderSource("personal_contact")}
              className={cn(
                pill,
                orderSource === "personal_contact" ?
                  "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
              )}
            >
              <PenLine className='mr-1.5 inline h-4 w-4 -mt-0.5 opacity-80' />
              Personal contact
            </button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className='space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2 font-semibold text-gray-900'>
            <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-800'>
              2
            </span>
            <PackageSearch className='h-4 w-4 text-brand-600' />
            Products &amp; prices
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-xl'
              onClick={() => setLines((p) => [...p, emptyCatalogDraft()])}
            >
              <Plus className='mr-1.5 h-4 w-4' />
              Add catalog product
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-xl'
              onClick={() => setLines((p) => [...p, emptyManualDraft()])}
            >
              <Plus className='mr-1.5 h-4 w-4' />
              Add category Product
            </Button>
          </div>
        </div>

        <div className='space-y-4'>
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className='rounded-2xl border border-gray-100 bg-gray-50/40 p-4'
            >
              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <span className='text-xs font-bold uppercase tracking-wide text-gray-500'>
                  Line {idx + 1}
                </span>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => setLineKind(line.id, "catalog")}
                    className={cn(
                      pill,
                      line.kind === "catalog" ?
                        "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                    )}
                  >
                    Catalog
                  </button>
                  <button
                    type='button'
                    onClick={() => setLineKind(line.id, "manual")}
                    className={cn(
                      pill,
                      line.kind === "manual" ?
                        "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                    )}
                  >
                    Category / Other
                  </button>
                </div>
              </div>

              {line.kind === "catalog" ?
                <CatalogLineEditor
                  lineId={line.id}
                  line={line}
                  patch={patchCatalog}
                  onRemove={() => removeLine(line.id)}
                  canRemove={lines.length > 1}
                />
              : <ManualLineEditor
                  lineId={line.id}
                  line={line}
                  patch={patchManual}
                  shopCategories={shopCategories}
                  categoriesLoading={categoriesLoading}
                  onRemove={() => removeLine(line.id)}
                  canRemove={lines.length > 1}
                />
              }
            </div>
          ))}
        </div>
      </section>

      {/* Delivery */}
      <section className='space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex items-center gap-2 font-semibold text-gray-900'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-800'>
            3
          </span>
          <Truck className='h-4 w-4 text-brand-600' />
          Delivery
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={() => setFulfillment("delhivery")}
            className={cn(
              pill,
              fulfillment === "delhivery" ?
                "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
              : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
            )}
          >
            <Truck className='mr-1.5 inline h-4 w-4 -mt-0.5 opacity-80' />
            Delhivery / courier
          </button>
          <button
            type='button'
            onClick={() => setFulfillment("offline_handover")}
            className={cn(
              pill,
              fulfillment === "offline_handover" ?
                "border-brand-400 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
              : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
            )}
          >
            <HandIcon className='mr-1.5 inline h-4 w-4 -mt-0.5 opacity-80' />
            Offline handover
          </button>
        </div>

        {fulfillment === "delhivery" && (
          <div className='space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4'>
            <div className='flex items-start gap-2 text-sm text-amber-900'>
              <MapPin className='mt-0.5 h-4 w-4 shrink-0' />
              <p>
                Used for courier labels and Delhivery automation — same rules as
                web checkout orders.
              </p>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='block space-y-1.5'>
                <span className='text-xs text-gray-600'>Recipient name</span>
                <input
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                  placeholder='Defaults to customer name'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className='text-xs text-gray-600'>Phone</span>
                <input
                  value={shipPhone}
                  onChange={(e) => setShipPhone(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                  placeholder='10-digit'
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className='text-xs text-gray-600'>
                  Flat / house (optional)
                </span>
                <input
                  value={shipHouse}
                  onChange={(e) => setShipHouse(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className='text-xs text-gray-600'>Street / area</span>
                <input
                  value={shipStreet}
                  onChange={(e) => setShipStreet(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className='text-xs text-gray-600'>
                  Landmark (optional)
                </span>
                <input
                  value={shipLandmark}
                  onChange={(e) => setShipLandmark(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className='text-xs text-gray-600'>City</span>
                <input
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className='text-xs text-gray-600'>State</span>
                <input
                  value={shipState}
                  onChange={(e) => setShipState(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className='text-xs text-gray-600'>PIN code</span>
                <input
                  value={shipPin}
                  onChange={(e) =>
                    setShipPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className='h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm tracking-widest'
                  placeholder='6 digits'
                />
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Payment */}
      <section className='space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex items-center gap-2 font-semibold text-gray-900'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-800'>
            4
          </span>
          <Wallet className='h-4 w-4 text-brand-600' />
          Payment collected
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={() => setPaymentMethod("offline_upi")}
            className={cn(
              pill,
              paymentMethod === "offline_upi" ?
                "border-emerald-400 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200"
              : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
            )}
          >
            UPI (offline)
          </button>
          <button
            type='button'
            onClick={() => setPaymentMethod("offline_cash")}
            className={cn(
              pill,
              paymentMethod === "offline_cash" ?
                "border-emerald-400 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200"
              : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300",
            )}
          >
            Cash
          </button>
        </div>

        <label className='block space-y-1.5'>
          <span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
            Internal notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className='min-h-[72px] w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
            placeholder='Reference for your team…'
          />
        </label>
      </section>

      <div className='fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-8'>
        <div className='mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3'>
          <p className='text-xs text-gray-500'>
            Multiple lines are summed like checkout. In-person handover is
            delivered + paid with no shipping.
          </p>
          <Button
            type='button'
            variant='brand'
            className='min-w-[160px] rounded-xl'
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            Create order
          </Button>
        </div>
      </div>
    </div>
  );
}
