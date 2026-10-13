"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Calculator,
  Download,
  Info,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import AdminOrderPackingSlip4R from "@/components/admin/AdminOrderPackingSlip4R";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";

/* ── weight helpers (mirror backend) ─────────────────────────────────── */

function chargeableWeightGmLocal(
  l: number,
  b: number,
  h: number,
  actualGramsPerBox: number,
): number {
  const volKg = (l * b * h) / 5000;
  const volG = Math.ceil(volKg * 1000);
  return Math.max(Math.ceil(actualGramsPerBox), volG);
}

/** Same as backend `perBoxDeadWeightGm` - total weight split across boxes, min 50g per piece */
function perBoxDeadWeightGmLocal(totalGrams: number, boxCount: number): number {
  const boxes = Math.min(5, Math.max(1, Math.floor(boxCount)));
  return Math.max(50, Math.ceil(totalGrams / boxes));
}

function volumetricWeightGmLocal(l: number, b: number, h: number): number {
  return Math.ceil(((l * b * h) / 5000) * 1000);
}

/** Delhivery Kinko `/invoice/charges` returns an array of rate rows - use first row as authoritative. */
type DelhiveryKinkoRow = {
  charged_weight?: number;
  total_amount?: number;
  gross_amount?: number;
  zone?: string;
  status?: string;
  charge_DL?: number;
  charge_COD?: number;
  divisor?: number;
  tax_data?: { SGST?: number; CGST?: number; IGST?: number };
};

function parseDelhiveryKinkoRow(charges: unknown): DelhiveryKinkoRow | null {
  if (charges == null) return null;
  if (
    Array.isArray(charges) &&
    charges.length > 0 &&
    typeof charges[0] === "object" &&
    charges[0] !== null
  ) {
    return charges[0] as DelhiveryKinkoRow;
  }
  if (typeof charges === "object" && !Array.isArray(charges)) {
    return charges as DelhiveryKinkoRow;
  }
  return null;
}

const inputClass =
  "mt-1 w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300";
const fieldLabel =
  "text-[10px] font-bold text-gray-400 uppercase tracking-wider";

export default function AdminDelhiveryAutomationCard({
  order,
  orderId,
  onRefresh,
}: {
  order: Order;
  orderId: string;
  onRefresh: () => Promise<void>;
}) {
  const [cfg, setCfg] = useState<{
    configured: boolean;
    pickupLocationName: string | null;
    originPincode: string | null;
  } | null>(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const [estLoading, setEstLoading] = useState(false);
  const [shipLoading, setShipLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [labelPdfSize, setLabelPdfSize] = useState<"4R" | "A4">("4R");
  const [labelLoading, setLabelLoading] = useState(false);
  const [freeformPin, setFreeformPin] = useState("");
  const [freePinLoading, setFreePinLoading] = useState(false);
  const [freePinResult, setFreePinResult] = useState<{
    serviceable: boolean;
    remark?: string;
  } | null>(null);
  const [estimate, setEstimate] = useState<{
    boxCount?: number;
    perBoxDeadWeightGm?: number;
    chargeableWeightGm?: number;
    cgmRequested?: number;
    chargedWeightDelhivery?: number;
    charges: unknown;
    tatDays?: number;
  } | null>(null);

  const [pkgType, setPkgType] = useState<"box" | "flyer" | "">("");
  const [shippingMode, setShippingMode] = useState<"Surface" | "Express">(
    "Surface",
  );
  const [boxCount, setBoxCount] = useState(1);
  const [dims, setDims] = useState({ l: 20, b: 15, h: 10, w: 500 });

  useEffect(() => {
    let c = true;
    adminApi
      .getDelhiveryStatus()
      .then((res) => {
        if (!c) return;
        setCfg({
          configured: res.data.configured,
          pickupLocationName: res.data.pickupLocationName ?? null,
          originPincode: res.data.originPincode ?? null,
        });
      })
      .catch(() => {
        if (!c) return;
        setCfg({
          configured: false,
          pickupLocationName: null,
          originPincode: null,
        });
      })
      .finally(() => {
        if (c) setCfgLoading(false);
      });
    return () => {
      c = false;
    };
  }, []);

  useEffect(() => {
    const p = order.shippingAddress?.pincode?.replace(/\D/g, "").slice(0, 6);
    if (p && p.length === 6) {
      setFreeformPin(p);
      setFreePinResult(null);
    }
  }, [order._id, order.shippingAddress?.pincode]);

  const dimSum = dims.l + dims.b + dims.h;
  const perBoxDeadLocal = perBoxDeadWeightGmLocal(dims.w, boxCount);
  const localVolumetricGm = volumetricWeightGmLocal(dims.l, dims.b, dims.h);
  const localChargeable = chargeableWeightGmLocal(
    dims.l,
    dims.b,
    dims.h,
    perBoxDeadLocal,
  );
  const codMpsBlocked = order.paymentMethod === "cod" && boxCount > 1;
  const canShip =
    cfg?.configured &&
    ["confirmed", "processing"].includes(order.status) &&
    dimSum >= 15 &&
    dims.w >= 50 &&
    !codMpsBlocked;

  const kinkoRow = useMemo(
    () => parseDelhiveryKinkoRow(estimate?.charges),
    [estimate?.charges],
  );

  const isDelhiveryOrder = (order.shippingCarrier || "")
    .toLowerCase()
    .includes("delhivery");
  const hasAwb = Boolean(order.trackingNumber?.trim());
  const postShip = order.status === "shipped" || order.status === "delivered";
  const preShip = ["confirmed", "processing"].includes(order.status);

  const checkFreePin = async () => {
    const clean = freeformPin.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      toast.error("Enter a 6-digit pincode");
      return;
    }
    setFreePinLoading(true);
    setFreePinResult(null);
    try {
      const res = await adminApi.checkDelhiveryServiceability(clean);
      setFreePinResult({
        serviceable: Boolean(res.data.serviceable),
        remark: res.data.remark,
      });
      toast.success(
        res.data.serviceable ?
          "PIN is serviceable by Delhivery"
        : "PIN may not be serviceable",
      );
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "PIN check failed");
    } finally {
      setFreePinLoading(false);
    }
  };

  const runEstimate = async () => {
    if (dimSum < 15) {
      toast.error("Length + breadth + height must be at least 15 cm");
      return;
    }
    if (dims.w < 50) {
      toast.error("Weight must be at least 50 g");
      return;
    }
    setEstLoading(true);
    setEstimate(null);
    try {
      const md = shippingMode === "Express" ? "E" : "S";
      const res = await adminApi.estimateDelhivery(orderId, {
        md,
        lengthCm: dims.l,
        breadthCm: dims.b,
        heightCm: dims.h,
        weightGm: dims.w,
        boxCount,
        ...(pkgType ? { ipkg_type: pkgType } : {}),
      });
      setEstimate({
        boxCount: res.data.boxCount,
        perBoxDeadWeightGm: res.data.perBoxDeadWeightGm,
        chargeableWeightGm: res.data.chargeableWeightGm,
        cgmRequested: res.data.cgmRequested,
        chargedWeightDelhivery: res.data.chargedWeightDelhivery,
        charges: res.data.charges,
        tatDays: res.data.tatDays,
      });
      toast.success("Estimate loaded from Delhivery");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Estimate failed");
    } finally {
      setEstLoading(false);
    }
  };

  const createShipment = async () => {
    if (!canShip) return;
    const destPin =
      order.shippingAddress?.pincode?.replace(/\D/g, "").slice(0, 6) ?? "";
    const typedPin = freeformPin.replace(/\D/g, "").slice(0, 6);
    if (typedPin.length !== 6) {
      toast.error(
        "Enter the 6-digit PIN above (defaults to this order’s shipping PIN).",
      );
      return;
    }
    if (typedPin === destPin) {
      if (!freePinResult) {
        const ok = window.confirm(
          "You have not tapped Check for this PIN yet. Delhivery serviceability is unknown. Continue anyway?",
        );
        if (!ok) return;
      } else if (!freePinResult.serviceable) {
        const ok = window.confirm(
          "Delhivery indicates this PIN may not be serviceable. Create shipment anyway?",
        );
        if (!ok) return;
      }
    } else {
      const ok = window.confirm(
        `PIN in the box (${typedPin}) is not this order’s shipping PIN (${destPin || "-"}). The shipment will still use the order’s saved address (${destPin || "missing"}). Continue?`,
      );
      if (!ok) return;
    }
    if (
      !window.confirm(
        "Create Delhivery shipment with these dimensions? The order stays in Processing until Delhivery confirms pickup (or you mark shipped manually). No premature shipped email.",
      )
    ) {
      return;
    }
    setShipLoading(true);
    try {
      await adminApi.createDelhiveryShipment(orderId, {
        shippingMode,
        lengthCm: dims.l,
        breadthCm: dims.b,
        heightCm: dims.h,
        weightGm: dims.w,
        boxCount,
        ...(pkgType ? { ipkg_type: pkgType } : {}),
      });
      await onRefresh();
      toast.success("Delhivery manifest created — order in Processing");
    } catch (e: unknown) {
      toast.error(
        (e as { message?: string })?.message || "Shipment creation failed",
      );
    } finally {
      setShipLoading(false);
    }
  };

  const syncNow = async () => {
    setSyncLoading(true);
    try {
      const res = await adminApi.syncDelhiveryTracking(orderId);
      await onRefresh();
      const msg = res.data.summary?.trim();
      toast.success(msg && msg.length > 0 ? msg : "Tracking synced");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Sync failed");
    } finally {
      setSyncLoading(false);
    }
  };

  const openPackingSlipPdf = async (mode: "download" | "print") => {
    setLabelLoading(true);
    try {
      const blob = await adminApi.downloadDelhiveryPackingSlipFile(orderId, {
        pdf_size: labelPdfSize,
      });
      const waybill = order.trackingNumber?.trim() || "awb";
      const safeName = `delhivery-label-${waybill}-${labelPdfSize}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = safeName;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        toast.success("Delhivery PDF downloaded");
      } else {
        const w = window.open(objectUrl, "_blank", "noopener,noreferrer");
        if (!w) {
          URL.revokeObjectURL(objectUrl);
          toast.error("Pop-up blocked - allow pop-ups to print the label.");
          return;
        }
        toast.success(
          "PDF opened - use Print (Ctrl+P) and choose your 4×6 or A4 printer.",
        );
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
      }
    } catch (e: unknown) {
      toast.error(
        (e as { message?: string })?.message || "Could not load shipping label",
      );
    } finally {
      setLabelLoading(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────── */

  if (cfgLoading) {
    return (
      <AdminOrderSectionCard icon={Truck} tone='sky' title='Delhivery automation'>
        <p className='flex items-center gap-2 text-sm text-gray-500'>
          <Loader2 className='h-4 w-4 animate-spin' /> Loading Delhivery settings…
        </p>
      </AdminOrderSectionCard>
    );
  }

  if (!cfg?.configured) {
    return (
      <AdminOrderSectionCard
        icon={Truck}
        tone='amber'
        title='Delhivery automation'
        description='Not configured on this server'
        className='border-amber-200/80'
      >
        <p className='text-sm text-amber-950 leading-relaxed'>
          Set{" "}
          <code className='text-xs bg-amber-50 border border-amber-100 px-1 rounded'>
            DELHIVERY_API_TOKEN
          </code>
          ,{" "}
          <code className='text-xs bg-amber-50 border border-amber-100 px-1 rounded'>
            DELHIVERY_PICKUP_LOCATION_NAME
          </code>
          , and{" "}
          <code className='text-xs bg-amber-50 border border-amber-100 px-1 rounded'>
            DELHIVERY_ORIGIN_PINCODE
          </code>{" "}
          on the server. Optional:{" "}
          <code className='text-xs bg-amber-50 border border-amber-100 px-1 rounded'>
            DELHIVERY_USE_STAGING=true
          </code>{" "}
          for staging API.
        </p>
      </AdminOrderSectionCard>
    );
  }

  const d = order.delhivery;

  const isPending = order.status === "pending";

  // Nothing actionable for cancelled / refunded orders
  if (!preShip && !postShip && !isPending) {
    return null;
  }

  const headerChip =
    postShip && isDelhiveryOrder && hasAwb ?
      <span className='inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-100 px-2.5 py-1 text-[11px] font-semibold'>
        <span className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
        {d?.lastPackageStatus || "In transit"}
      </span>
    : d?.shipmentCreatedAt ?
      <span className='inline-flex items-center gap-1.5 rounded-full bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-100 px-2.5 py-1 text-[11px] font-semibold'>
        Manifested
      </span>
    : <span className='inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-[11px] font-semibold'>
        Ready
      </span>;

  return (
    <AdminOrderSectionCard
      id='fulfillment'
      icon={Truck}
      tone='sky'
      title='Delhivery automation'
      description={
        <>
          Pickup{" "}
          <span className='font-semibold text-gray-700'>
            {cfg.pickupLocationName || "-"}
          </span>{" "}
          · Origin PIN{" "}
          <span className='font-mono text-gray-700'>{cfg.originPincode || "-"}</span>
        </>
      }
      action={headerChip}
      bodyClassName='space-y-5'
    >
      {/* ── Post-ship: shipment status, sync, labels ───────────────── */}
      {postShip ?
        <div className='space-y-4'>
          {d?.package ?
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
              <Tile label='Mode' value={d.package.shippingMode || "-"} />
              <Tile
                label='Dims (cm)'
                value={`${d.package.lengthCm ?? "-"}×${d.package.breadthCm ?? "-"}×${d.package.heightCm ?? "-"}`}
              />
              <Tile
                label='Weight'
                value={`${d.package.weightGmTotal ?? "-"} g`}
                sub={`${d.package.boxCount ?? 1} box${(d.package.boxCount ?? 1) > 1 ? "es" : ""}`}
              />
              <Tile
                label='TAT'
                value={
                  typeof d.estimatedTatDays === "number" ?
                    `~${d.estimatedTatDays} d`
                  : "-"
                }
              />
            </div>
          : null}

          {(d?.lastTrackSummary || d?.lastPackageStatus) && (
            <div className='rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <MicroLabel className='text-indigo-700/80'>Courier status</MicroLabel>
                  <p className='text-sm font-semibold text-gray-900 mt-0.5'>
                    {d?.lastPackageStatus || "-"}
                  </p>
                  {d?.lastTrackSummary ?
                    <p className='text-xs text-gray-700 mt-1 leading-relaxed'>
                      {d.lastTrackSummary}
                    </p>
                  : null}
                  {d?.lastTrackSyncAt ?
                    <p className='text-[10px] text-gray-400 mt-1.5'>
                      Last synced {formatDateTime(d.lastTrackSyncAt)}
                    </p>
                  : null}
                </div>
                {order.status === "shipped" && isDelhiveryOrder && hasAwb ?
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='rounded-xl gap-1.5 bg-white shrink-0'
                    loading={syncLoading}
                    onClick={() => void syncNow()}
                  >
                    <RefreshCw className='h-3.5 w-3.5' /> Sync now
                  </Button>
                : null}
              </div>
            </div>
          )}

          {Array.isArray(d?.trackScansSnapshot) &&
            d.trackScansSnapshot.length > 0 && (
              <details className='group rounded-xl border border-gray-200'>
                <summary className='cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-gray-700 flex items-center justify-between'>
                  Scan history ({d.trackScansSnapshot.length})
                  <span className='text-gray-400 group-open:rotate-180 transition-transform'>
                    ▾
                  </span>
                </summary>
                <ol className='border-t border-gray-100 divide-y divide-gray-100 max-h-56 overflow-y-auto'>
                  {[...d.trackScansSnapshot].reverse().map((s, i) => (
                    <li key={i} className='px-4 py-2 text-xs'>
                      <p className='font-medium text-gray-800'>
                        {s.status || s.detail || "-"}
                      </p>
                      <p className='text-gray-500'>
                        {[s.location, s.time].filter(Boolean).join(" · ")}
                      </p>
                      {s.status && s.detail && s.detail !== s.status ?
                        <p className='text-gray-500'>{s.detail}</p>
                      : null}
                    </li>
                  ))}
                </ol>
              </details>
            )}

          {isDelhiveryOrder && hasAwb ?
            <div className='rounded-xl border border-gray-200 p-4 space-y-3'>
              <div>
                <p className='text-sm font-semibold text-gray-900'>Shipping label</p>
                <p className='text-[11px] text-gray-500 leading-snug mt-0.5'>
                  Delhivery’s official packing slip (API PDF). 4×6 thermal by
                  default, or A4.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <label className='sr-only' htmlFor='delhivery-label-size'>
                  Label size
                </label>
                <select
                  id='delhivery-label-size'
                  value={labelPdfSize}
                  onChange={(e) => setLabelPdfSize(e.target.value as "4R" | "A4")}
                  disabled={labelLoading}
                  className='h-9 px-2.5 border border-gray-200 rounded-lg text-xs font-medium bg-white text-gray-800 min-w-[7rem]'
                >
                  <option value='4R'>4×6 (4R)</option>
                  <option value='A4'>A4 (8×11)</option>
                </select>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='rounded-xl gap-1.5 h-9'
                  loading={labelLoading}
                  onClick={() => void openPackingSlipPdf("download")}
                >
                  <Download className='h-3.5 w-3.5' aria-hidden /> Download PDF
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='rounded-xl gap-1.5 h-9'
                  loading={labelLoading}
                  onClick={() => void openPackingSlipPdf("print")}
                >
                  <Printer className='h-3.5 w-3.5' aria-hidden /> Open &amp; print
                </Button>
              </div>
              <details className='group pt-2 border-t border-dashed border-gray-200'>
                <summary className='cursor-pointer list-none text-[11px] font-semibold text-gray-600 flex items-center justify-between'>
                  In-house packing slip (4×6 layout)
                  <span className='text-gray-400 group-open:rotate-180 transition-transform'>
                    ▾
                  </span>
                </summary>
                <div className='mt-3'>
                  <AdminOrderPackingSlip4R
                    order={order}
                    awb={order.trackingNumber!.trim()}
                  />
                </div>
              </details>
            </div>
          : null}
        </div>
      : null}

      {/* ── Pre-ship: PIN check → package → estimate → create ─────── */}
      {preShip || isPending ?
        <div className='space-y-5'>
          {isPending ?
            <p className='rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-xs text-amber-900'>
              Confirm the order to unlock package details and shipment creation.
              You can pre-check the PIN now.
            </p>
          : null}
          <Step n={1} title='PIN serviceability' icon={MapPin}>
            <p className='text-xs text-gray-500 leading-snug'>
              Pre-filled with this order’s shipping PIN. Shipment always uses
              the saved address. NSZ = not serviceable; Embargo = temporary hold.
            </p>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <input
                type='text'
                name='delhivery-free-pin'
                autoComplete='postal-code'
                inputMode='numeric'
                maxLength={6}
                placeholder='6-digit PIN'
                className='h-10 px-3 border border-gray-200 rounded-xl text-sm font-mono w-[7.5rem] tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-300'
                value={freeformPin}
                onChange={(e) =>
                  setFreeformPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl h-10'
                loading={freePinLoading}
                onClick={() => void checkFreePin()}
              >
                Check
              </Button>
              {freePinResult ?
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
                    freePinResult.serviceable ?
                      "bg-emerald-50 text-emerald-800 ring-emerald-100"
                    : "bg-red-50 text-red-800 ring-red-100",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      freePinResult.serviceable ? "bg-emerald-500" : "bg-red-500",
                    )}
                  />
                  {freePinResult.serviceable ? "Serviceable" : "Not serviceable"}
                </span>
              : null}
            </div>
            {freePinResult?.remark ?
              <p className='text-xs text-gray-600 mt-1.5'>{freePinResult.remark}</p>
            : null}
          </Step>

          {preShip ? <>
          <Step n={2} title='Package' icon={Boxes}>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              <div>
                <label className={fieldLabel}>Package type</label>
                <select
                  value={pkgType}
                  onChange={(e) => setPkgType(e.target.value as "box" | "flyer" | "")}
                  className={inputClass}
                >
                  <option value=''>Optional</option>
                  <option value='box'>Box</option>
                  <option value='flyer'>Flyer</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Speed</label>
                <select
                  value={shippingMode}
                  onChange={(e) =>
                    setShippingMode(e.target.value as "Surface" | "Express")
                  }
                  className={inputClass}
                >
                  <option value='Surface'>Surface</option>
                  <option value='Express'>Express</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Boxes</label>
                <select
                  value={boxCount}
                  onChange={(e) => setBoxCount(parseInt(e.target.value, 10))}
                  className={inputClass}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-4 gap-3 mt-3'>
              {(["l", "b", "h"] as const).map((k) => (
                <div key={k}>
                  <label className={fieldLabel}>
                    {k === "l" ? "Length" : k === "b" ? "Breadth" : "Height"}{" "}
                    <span className='normal-case font-medium'>cm</span>
                  </label>
                  <input
                    type='number'
                    min={1}
                    className={cn(inputClass, "tabular-nums")}
                    value={dims[k]}
                    onChange={(e) =>
                      setDims((p) => ({
                        ...p,
                        [k]: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              ))}
              <div>
                <label className={fieldLabel}>
                  {boxCount > 1 ? "Total weight" : "Weight"}{" "}
                  <span className='normal-case font-medium'>g</span>
                </label>
                <input
                  type='number'
                  min={1}
                  className={cn(inputClass, "tabular-nums")}
                  value={dims.w}
                  onChange={(e) =>
                    setDims((p) => ({
                      ...p,
                      w: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className='mt-3 grid grid-cols-3 gap-2'>
              <Tile label='Per-box dead' value={`${perBoxDeadLocal} g`} />
              <Tile label='Volumetric' value={`${localVolumetricGm} g`} />
              <Tile
                label='Chargeable'
                value={`${localChargeable} g`}
                emphasis
              />
            </div>
            <p className='text-[10px] text-gray-500 mt-2 leading-relaxed'>
              Chargeable = max(per-box dead, volumetric) · volumetric = L×B×H÷5000
              kg. L+B+H ≥ 15 cm, weight ≥ 50 g.
              {boxCount > 1 ?
                ` Per-box dead = max(50g, ceil(${dims.w || 0}÷${boxCount})).`
              : ""}
            </p>
          </Step>

          <Step n={3} title='Rate & create' icon={Calculator}>
            <div className='flex flex-wrap items-start gap-6'>
              <div>
                <MicroLabel>
                  {(
                    kinkoRow?.charged_weight != null &&
                    Number.isFinite(kinkoRow.charged_weight)
                  ) ?
                    "Charged weight (Delhivery)"
                  : estimate?.chargeableWeightGm != null ?
                    "Chargeable weight (cgm sent)"
                  : "Estimated weight (local)"}
                </MicroLabel>
                <p className='text-xl font-bold text-gray-900 tabular-nums'>
                  {(
                    kinkoRow?.charged_weight != null &&
                    Number.isFinite(kinkoRow.charged_weight)
                  ) ?
                    `${kinkoRow.charged_weight} g`
                  : estimate?.chargeableWeightGm != null ?
                    `${estimate.chargeableWeightGm} g`
                  : `${localChargeable} g`}
                </p>
                {estimate?.cgmRequested != null &&
                  kinkoRow?.charged_weight != null &&
                  estimate.cgmRequested !== kinkoRow.charged_weight && (
                    <p className='text-[10px] text-gray-500 mt-1 max-w-xs'>
                      cgm sent {estimate.cgmRequested} g · Delhivery billed on{" "}
                      {kinkoRow.charged_weight} g.
                    </p>
                  )}
              </div>
              {typeof kinkoRow?.total_amount === "number" ?
                <div>
                  <MicroLabel>Quote (incl. tax)</MicroLabel>
                  <p className='text-xl font-bold text-emerald-800 tabular-nums'>
                    {formatPrice(kinkoRow.total_amount)}
                  </p>
                </div>
              : null}
              {estimate?.tatDays != null ?
                <div>
                  <MicroLabel>TAT</MicroLabel>
                  <p className='text-xl font-bold text-gray-900'>
                    ~{estimate.tatDays} d
                  </p>
                </div>
              : null}
            </div>

            {kinkoRow ?
              <dl className='mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-xl border border-emerald-100 bg-emerald-50/40 p-3'>
                {kinkoRow.zone ?
                  <Row k='Zone' v={kinkoRow.zone} />
                : null}
                {typeof kinkoRow.charge_DL === "number" ?
                  <Row k='Forward' v={formatPrice(kinkoRow.charge_DL)} mono />
                : null}
                {order.paymentMethod === "cod" &&
                typeof kinkoRow.charge_COD === "number" ?
                  <Row k='COD fee' v={formatPrice(kinkoRow.charge_COD)} mono />
                : null}
                {typeof kinkoRow.gross_amount === "number" ?
                  <Row k='Gross (pre-tax)' v={formatPrice(kinkoRow.gross_amount)} mono />
                : null}
                {kinkoRow.tax_data &&
                (typeof kinkoRow.tax_data.SGST === "number" ||
                  typeof kinkoRow.tax_data.CGST === "number") ?
                  <div className='col-span-2 text-[10px] text-gray-600'>
                    Tax: SGST {kinkoRow.tax_data.SGST ?? 0} + CGST{" "}
                    {kinkoRow.tax_data.CGST ?? 0}
                    {typeof kinkoRow.tax_data.IGST === "number" &&
                    kinkoRow.tax_data.IGST > 0 ?
                      ` + IGST ${kinkoRow.tax_data.IGST}`
                    : ""}
                  </div>
                : null}
              </dl>
            : null}

            <div className='mt-3 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 flex gap-2 text-[11px] text-sky-900'>
              <Info className='h-3.5 w-3.5 shrink-0 mt-0.5' />
              Estimated cost may differ from final billing after physical
              measurement at pickup.
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                className='rounded-xl'
                loading={estLoading}
                onClick={() => void runEstimate()}
              >
                Get estimate
              </Button>
              <Button
                type='button'
                variant='brand'
                className='rounded-xl'
                loading={shipLoading}
                disabled={!canShip}
                onClick={() => void createShipment()}
              >
                <Truck className='h-4 w-4 mr-1.5' /> Create Delhivery shipment
              </Button>
            </div>
            {!canShip ?
              <p className='text-xs text-amber-800 mt-2'>
                {codMpsBlocked ?
                  "COD orders must ship as a single box here (multi-box: add tracking manually)."
                : "Fix dimensions (L+B+H ≥ 15 cm, weight ≥ 50 g) or wait until the order is Confirmed / Processing."
                }
              </p>
            : null}

            {estimate?.charges != null ?
              <details className='mt-3 text-[11px]'>
                <summary className='cursor-pointer font-semibold text-gray-500'>
                  Raw API response
                </summary>
                <pre className='mt-2 p-3 bg-gray-50 rounded-xl overflow-x-auto text-[10px] border border-gray-100 text-gray-600'>
                  {JSON.stringify(estimate.charges, null, 2)}
                </pre>
              </details>
            : null}
          </Step>
          </> : null}
        </div>
      : null}
    </AdminOrderSectionCard>
  );
}

/* ── tiny presentational helpers ─────────────────────────────────────── */

function Tile({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        emphasis ?
          "border-brand-200 bg-brand-50/60"
        : "border-gray-100 bg-gray-50/80",
      )}
    >
      <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums mt-0.5",
          emphasis ? "text-brand-900" : "text-gray-900",
        )}
      >
        {value}
      </p>
      {sub ?
        <p className='text-[10px] text-gray-500'>{sub}</p>
      : null}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className='flex justify-between gap-3'>
      <dt className='text-gray-600'>{k}</dt>
      <dd className={cn("font-semibold text-gray-900", mono && "font-mono tabular-nums")}>
        {v}
      </dd>
    </div>
  );
}

function Step({
  n,
  title,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-xl border border-gray-200 p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <span className='h-6 w-6 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0'>
          {n}
        </span>
        <Icon className='h-4 w-4 text-gray-500' aria-hidden />
        <p className='text-sm font-semibold text-gray-900'>{title}</p>
      </div>
      {children}
    </div>
  );
}
