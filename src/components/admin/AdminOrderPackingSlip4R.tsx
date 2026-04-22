"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Printer, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import JsBarcode from "jsbarcode";
import type { Order } from "@/types";
import { formatDateTime } from "@/lib/utils";

const SELLER_NAME = "The House of Rani";
const SELLER_ADDRESS =
  "E-1006, Amrapali Princely Estate, Sector 76, Near Sector 76 Metro Station, Noida, Uttar Pradesh 201301";

/** Footer — full-width row under products; duplicate city names removed. */
const RETURN_ADDRESS_TEXT =
  "E-1006, Amrapali Princely Estate, Sector 76, Noida, Uttar Pradesh 201301, India";

/** Physical 4×6" label — preview & print use the same numbers (CSS `in` = print units). */
const LABEL_PAGE = {
  /** Full sheet */
  w: "4in",
  h: "6in",
  /** Typical safe margin on thermal / laser */
  margin: "0.125in",
} as const;

/** Printable box = page − 2× margin */
const LABEL_SLIP = {
  w: "3.75in",
  minH: "5.75in",
} as const;

/** JsBarcode: integer `width` (px per bar) avoids blurry sub-pixel bars; larger `height` = sharper when scaled. */
function barcodeOptsAwb() {
  return {
    format: "CODE128" as const,
    width: 2,
    height: 56,
    displayValue: false,
    margin: 0,
    lineColor: "#000000",
    background: "#ffffff",
  };
}

function barcodeOptsOrder() {
  return {
    format: "CODE128" as const,
    width: 1,
    height: 28,
    displayValue: false,
    margin: 0,
    lineColor: "#000000",
    background: "#ffffff",
  };
}

function drawAwbBarcode(canvas: HTMLCanvasElement | null, text: string) {
  if (!canvas || !text.trim()) return;
  try {
    JsBarcode(canvas, text.trim(), barcodeOptsAwb());
  } catch {
    /* ignore */
  }
}

function drawOrderBarcode(canvas: HTMLCanvasElement | null, raw: string) {
  if (!canvas) return;
  try {
    JsBarcode(canvas, raw, barcodeOptsOrder());
  } catch {
    try {
      JsBarcode(
        canvas,
        raw.replace(/[^A-Z0-9]/gi, "").slice(0, 24),
        barcodeOptsOrder(),
      );
    } catch {
      /* ignore */
    }
  }
}

/** 4×6" (4R) PDF page — same as Delhivery `pdf_size=4R` */
const PDF_4R_IN = { w: 4, h: 6 } as const;
/** Same as LABEL_PAGE.margin — inset for label on PDF page */
const PDF_MARGIN_IN = 0.125;
const PDF_INNER = {
  w: PDF_4R_IN.w - 2 * PDF_MARGIN_IN,
  h: PDF_4R_IN.h - 2 * PDF_MARGIN_IN,
} as const;

/** Injected into print window — same logical size as preview (4×6 in). */
const PRINT_STYLES = `
  @page {
    size: 101.6mm 152.4mm;
    margin: 3.175mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
    min-height: 100%;
    font-size: 7px;
    line-height: 1.18;
    font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* One slip block — same width as on-screen preview */
  [data-packing-slip-root] {
    width: ${LABEL_SLIP.w} !important;
    min-width: ${LABEL_SLIP.w} !important;
    max-width: ${LABEL_SLIP.w} !important;
    min-height: ${LABEL_SLIP.minH};
    margin: 0 auto !important;
    transform: none !important;
    zoom: 1 !important;
  }
  table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; }
  svg { display: block; margin-left: auto; margin-right: auto; max-width: 100%; height: auto; }
  canvas[data-barcode] {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 100%;
    height: auto;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
  }
  @media print {
    html, body { overflow: visible !important; font-size: 7.5px; }
  }
`;

/** Same visual date on screen + print (e.g. 16 Apr 2026 | 10:51 pm) */
function formatSlipDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date(iso))
      .replace(",", " |");
  } catch {
    return formatDateTime(iso);
  }
}

function resolveShipMode(order: Order): "Surface" | "Express" {
  const raw = order.delhivery?.package?.shippingMode;
  if (raw === "Express" || raw === "Surface") return raw;
  const t = JSON.stringify(order.delhivery ?? {}).toLowerCase();
  if (t.includes("express")) return "Express";
  return "Surface";
}

function slipInr(n: number): string {
  return `INR ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`;
}

function slipInrItem(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Rough routing hint (e.g. GAY/MMH) — display only; not from courier API */
function routingHint(order: Order): string {
  const a = order.shippingAddress;
  if (!a?.city || !a?.state) return "—";
  const left = a.city.replace(/\s/g, "").slice(0, 3).toUpperCase();
  const right = a.state.replace(/\s/g, "").slice(0, 3).toUpperCase();
  return `${left}/${right}`;
}

type Props = {
  order: Order;
  awb: string;
};

function ProductLinesTable({
  order,
  gridCell,
  slipInrItem,
}: {
  order: Order;
  gridCell: (row: number, col: number, extra?: CSSProperties) => CSSProperties;
  slipInrItem: (n: number) => string;
}) {
  const items = order.items ?? [];
  const totalRow = items.length + 1;

  return (
    <table style={{ width: "100%", ...TABLE_SEP, fontSize: "7px" }}>
      <thead>
        <tr style={{ background: "#f3f4f6" }}>
          <th
            style={{
              ...gridCell(0, 0),
              padding: "5px 4px",
              fontWeight: 800,
              textAlign: "left",
              width: "44%",
            }}
          >
            Product Name &amp; SKU
          </th>
          <th
            style={{
              ...gridCell(0, 1),
              padding: "5px 4px",
              fontWeight: 800,
              width: "10%",
              textAlign: "center",
            }}
          >
            Qty.
          </th>
          <th
            style={{
              ...gridCell(0, 2),
              padding: "5px 4px",
              fontWeight: 800,
              width: "20%",
              textAlign: "right",
            }}
          >
            Price
          </th>
          <th
            style={{
              ...gridCell(0, 3),
              padding: "5px 4px",
              fontWeight: 800,
              width: "26%",
              textAlign: "right",
            }}
          >
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, idx) => {
          const r = idx + 1;
          return (
            <tr key={idx}>
              <td
                style={{
                  ...gridCell(r, 0),
                  padding: "4px 4px",
                  lineHeight: 1.3,
                }}
              >
                <span style={{ fontWeight: 600 }}>{it.name}</span>
                {it.variant?.sku ?
                  <span
                    style={{
                      display: "block",
                      fontSize: "6px",
                      color: "#444",
                      marginTop: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    SKU:{it.variant.sku}
                  </span>
                : null}
              </td>
              <td
                style={{
                  ...gridCell(r, 1),
                  padding: "4px 4px",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {it.quantity}
              </td>
              <td
                style={{
                  ...gridCell(r, 2),
                  padding: "4px 4px",
                  textAlign: "right",
                  lineHeight: 1.3,
                }}
              >
                {slipInrItem(it.price)}
              </td>
              <td
                style={{
                  ...gridCell(r, 3),
                  padding: "4px 4px",
                  textAlign: "right",
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {slipInrItem(it.price * it.quantity)}
              </td>
            </tr>
          );
        })}
        <tr>
          <td
            colSpan={3}
            style={{
              ...gridCell(totalRow, 0),
              padding: "5px 4px",
              textAlign: "right",
              fontWeight: 800,
              lineHeight: 1.3,
            }}
          >
            Total
          </td>
          <td
            style={{
              ...gridCell(totalRow, 3),
              padding: "5px 4px",
              textAlign: "right",
              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            {slipInrItem(order.total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** html2canvas mis-draws border-collapse:collapse (borders slice through text). */
const TABLE_SEP: CSSProperties = {
  borderCollapse: "separate",
  borderSpacing: 0,
};

/** Grid lines: top+left on first row/col; every cell gets right+bottom (no doubled outer edge). */
function gridCell(
  row: number,
  col: number,
  extra?: CSSProperties,
): CSSProperties {
  return {
    borderTop: row === 0 ? "1px solid #000" : undefined,
    borderLeft: col === 0 ? "1px solid #000" : undefined,
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
    verticalAlign: "top",
    wordBreak: "break-word",
    boxSizing: "border-box",
    ...extra,
  };
}

/** Outer 2-column layout: same line model, colspan=2 rows use col 0 only. */
function outerCell(
  row: number,
  col: number,
  extra?: CSSProperties,
): CSSProperties {
  return gridCell(row, col, extra);
}

export default function AdminOrderPackingSlip4R({ order, awb }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const awbBarRef = useRef<HTMLCanvasElement>(null);
  const orderBarRef = useRef<HTMLCanvasElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const logoSrc =
    typeof window !== "undefined" ?
      `${window.location.origin}/logoNew.png`
    : "/logoNew.png";

  const awbTrim = awb?.trim() ?? "";

  useEffect(() => {
    drawAwbBarcode(awbBarRef.current, awbTrim);
  }, [awbTrim]);

  useEffect(() => {
    const raw = order.orderNumber?.trim() || order._id?.slice(-12) || "ORDER";
    drawOrderBarcode(orderBarRef.current, raw);
  }, [order.orderNumber, order._id]);

  /**
   * 4×6" (4R) PDF — same physical size as Delhivery `pdf_size=4R`.
   * Captures the white label (not the grey chrome) at fixed 3.75in width, full height,
   * so html2canvas does not clip and layout matches print.
   */
  const downloadPreviewPdf = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    setPdfBusy(true);

    const prev = {
      width: el.style.width,
      maxWidth: el.style.maxWidth,
      transform: el.style.transform,
    };

    try {
      // Lock width to printable width (avoids responsive `max(100vw)` shrinking layout vs PDF)
      el.style.width = LABEL_SLIP.w;
      el.style.maxWidth = LABEL_SLIP.w;
      el.style.transform = "none";

      drawAwbBarcode(awbBarRef.current, awbTrim);
      const rawOrder =
        order.orderNumber?.trim() || order._id?.slice(-12) || "ORDER";
      drawOrderBarcode(orderBarRef.current, rawOrder);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const fullW = Math.ceil(
        Math.max(el.scrollWidth, el.clientWidth, el.offsetWidth),
      );
      const fullH = Math.ceil(
        Math.max(el.scrollHeight, el.clientHeight, el.offsetHeight),
      );

      const canvas = await html2canvas(el, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: fullW,
        height: fullH,
        windowWidth: fullW,
        windowHeight: fullH,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        foreignObjectRendering: false,
        onclone: (doc) => {
          const node = doc.querySelector("[data-packing-slip-root]");
          if (node instanceof HTMLElement) {
            node.style.overflow = "visible";
            node.style.height = "auto";
          }
          doc.querySelectorAll("table").forEach((t) => {
            if (t instanceof HTMLElement) {
              t.style.borderCollapse = "separate";
              t.style.borderSpacing = "0px";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 1);
      const pdf = new jsPDF({
        unit: "in",
        format: [PDF_4R_IN.w, PDF_4R_IN.h],
        orientation: "portrait",
        compress: true,
      });

      const pw = PDF_4R_IN.w;
      const ph = PDF_4R_IN.h;
      const boxL = PDF_MARGIN_IN;
      const boxT = PDF_MARGIN_IN;
      const boxW = PDF_INNER.w;
      const boxH = PDF_INNER.h;

      const iw = canvas.width;
      const ih = canvas.height;
      const imgAspect = iw / ih;
      const boxAspect = boxW / boxH;

      let dispW: number;
      let dispH: number;
      let x: number;
      let y: number;

      if (imgAspect > boxAspect) {
        dispW = boxW;
        dispH = boxW / imgAspect;
        x = boxL;
        y = boxT + (boxH - dispH) / 2;
      } else {
        dispH = boxH;
        dispW = boxH * imgAspect;
        x = boxL + (boxW - dispW) / 2;
        y = boxT;
      }

      pdf.addImage(imgData, "PNG", x, y, dispW, dispH);

      const raw =
        order.orderNumber?.trim().replace(/[^\w.-]+/g, "_") ||
        order._id?.slice(-8) ||
        "order";
      pdf.save(`packing-slip-4R-${raw}.pdf`);
      toast.success("4×6 (4R) PDF downloaded — full label, nothing cropped");
    } catch {
      toast.error("Could not build PDF. Use Print packing slip instead.");
    } finally {
      el.style.width = prev.width;
      el.style.maxWidth = prev.maxWidth;
      el.style.transform = prev.transform;
      setPdfBusy(false);
    }
  }, [order.orderNumber, order._id, awbTrim]);

  const openPrintWindow = useCallback(() => {
    const node = rootRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    /** cloneNode does not copy canvas pixels — swap to data-URL images so print matches screen */
    const clone = node.cloneNode(true) as HTMLElement;
    const origCanvases = node.querySelectorAll("canvas[data-barcode]");
    const cloneCanvases = clone.querySelectorAll("canvas[data-barcode]");
    origCanvases.forEach((c, i) => {
      const cv = c as HTMLCanvasElement;
      const img = document.createElement("img");
      try {
        img.src = cv.toDataURL("image/png");
      } catch {
        img.src = "";
      }
      img.alt = "";
      img.style.cssText = cv.style.cssText;
      img.style.display = "block";
      img.style.marginLeft = "auto";
      img.style.marginRight = "auto";
      img.style.maxWidth = "100%";
      cloneCanvases[i]?.replaceWith(img);
    });
    const serialized = clone.outerHTML;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=384"/><!-- 4in @ 96dpi -->
<title>Packing slip ${order.orderNumber}</title>
<style>${PRINT_STYLES}</style></head><body>${serialized}
<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},450);});</script>
</body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [order.orderNumber]);

  const a = order.shippingAddress;
  const pin = a?.pincode?.trim() || "—";
  const shipMode = resolveShipMode(order);
  const paymentKind = order.paymentMethod === "cod" ? "COD" : "Pre-paid";
  const when =
    order.shippedAt ||
    order.delhivery?.shipmentCreatedAt ||
    order.statusHistory?.find((s) => s.status === "shipped")?.timestamp ||
    order.createdAt;

  const recipient = a?.name?.trim() || "—";
  const addrBody = useMemo(() => {
    if (!a) return "—";
    const bits: string[] = [];
    if (a.house) bits.push(a.house);
    if (a.street) bits.push(a.street);
    if (a.landmark) bits.push(`Near ${a.landmark}`);
    return bits.length ? bits.join(", ") : "—";
  }, [a]);

  /** Bold cluster line — second-image style (city + state). */
  const cityStateBold =
    a?.city && a?.state ? `${a.city} (${a.state})` : a?.city || a?.state || "—";
  const phone = a?.phone?.trim();

  const route = routingHint(order);

  /** Fixed 3.75in width on screen = same as print (preview matches downloaded PDF layout from Print). */
  const slipBoxStyle: CSSProperties = {
    border: "1px solid #000",
    fontSize: "7px",
    lineHeight: 1.18,
    fontFamily: "system-ui, Segoe UI, Roboto, Arial, sans-serif",
    backgroundColor: "#fff",
    width: LABEL_SLIP.w,
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className='space-y-2 w-full min-w-0'>
      {/* Visual 4×6" “sheet” — same aspect as print; slip is exactly the printable inset */}
      <div
        className='mx-auto rounded-sm border border-slate-300 bg-slate-200/80 shadow-inner'
        style={{
          width: LABEL_PAGE.w,
          maxWidth: "min(4in, calc(100vw - 24px))",
          boxSizing: "border-box",
          padding: LABEL_PAGE.margin,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "visible",
        }}
        aria-label='4 by 6 inch label preview'
      >
        <div ref={rootRef} data-packing-slip-root style={slipBoxStyle}>
          <table style={{ width: "100%", ...TABLE_SEP, tableLayout: "fixed" }}>
            <tbody>
              {/* Header logos */}
              <tr>
                <td
                  style={{
                    ...outerCell(0, 0),
                    padding: "4px 5px",
                    width: "52%",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt=''
                    style={{
                      height: 22,
                      width: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </td>
                <td
                  style={{
                    ...outerCell(0, 1),
                    padding: "4px 5px",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: "11px",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    <span style={{ color: "#000" }}>DELHI</span>
                    <span style={{ color: "#c41230" }}>VERY</span>
                  </span>
                </td>
              </tr>

              {/* AWB + barcode + PIN | AWB | routing */}
              <tr>
                <td
                  colSpan={2}
                  style={{ ...outerCell(1, 0), padding: "4px 5px 6px" }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "7.5px",
                      marginBottom: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    AWB# {awbTrim}
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2px 0 6px",
                      lineHeight: 1.15,
                    }}
                  >
                    <canvas
                      ref={awbBarRef}
                      data-barcode='awb'
                      style={{
                        maxWidth: "100%",
                        display: "block",
                        margin: "0 auto",
                        verticalAlign: "middle",
                        imageRendering: "crisp-edges",
                      }}
                    />
                  </div>
                  <table
                    style={{
                      width: "100%",
                      marginTop: 2,
                      fontSize: "7.5px",
                      tableLayout: "fixed",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            fontWeight: 700,
                            width: "26%",
                            verticalAlign: "bottom",
                            padding: "4px 4px 2px 0",
                            lineHeight: 1.25,
                          }}
                        >
                          {pin}
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            textAlign: "center",
                            verticalAlign: "bottom",
                            padding: "4px 4px 2px",
                            lineHeight: 1.25,
                          }}
                        >
                          AWB# {awbTrim}
                        </td>
                        <td
                          style={{
                            fontWeight: 800,
                            fontSize: "8px",
                            textAlign: "right",
                            width: "26%",
                            verticalAlign: "bottom",
                            padding: "4px 0 2px 4px",
                            lineHeight: 1.25,
                          }}
                        >
                          {route}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Shipping address | Payment + speed + date */}
              <tr>
                <td
                  style={{
                    ...outerCell(2, 0),
                    padding: "6px 6px",
                    width: "58%",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "7px",
                      marginBottom: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    Shipping address:
                  </div>
                  <div style={{ marginBottom: 3, lineHeight: 1.25 }}>
                    <span style={{ fontWeight: 800, fontSize: "8px" }}>
                      {recipient}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "6.5px",
                      color: "#222",
                      marginBottom: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    Phone: {phone || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: "7px",
                      marginBottom: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    {addrBody}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "7px",
                      marginBottom: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    {cityStateBold}
                  </div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "7.5px",
                      lineHeight: 1.25,
                    }}
                  >
                    PIN — {pin}
                  </div>
                </td>
                <td
                  style={{
                    ...outerCell(2, 1),
                    padding: "6px 6px",
                    width: "42%",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "8px",
                      lineHeight: 1.25,
                    }}
                  >
                    {paymentKind}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "7.5px",
                      marginTop: 3,
                      color: "#111",
                      lineHeight: 1.25,
                    }}
                  >
                    {shipMode}
                  </div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "13px",
                      marginTop: 5,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {slipInr(order.total)}
                  </div>
                  <div
                    style={{ borderTop: "1px solid #bbb", margin: "6px 0 4px" }}
                  />
                  <div
                    style={{
                      fontSize: "6.5px",
                      color: "#111",
                      fontWeight: 700,
                      lineHeight: 1.3,
                      paddingBottom: 2,
                    }}
                  >
                    Date: {when ? formatSlipDate(when) : "—"}
                  </div>
                </td>
              </tr>

              {/* Seller name + address | Order + barcode */}
              <tr>
                <td style={{ ...outerCell(3, 0), padding: "6px 6px" }}>
                  <div
                    style={{
                      fontSize: "6.5px",
                      fontWeight: 700,
                      color: "#333",
                      marginBottom: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    Seller
                  </div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "9px",
                      lineHeight: 1.25,
                      marginBottom: 4,
                    }}
                  >
                    {SELLER_NAME}
                  </div>
                  <div
                    style={{
                      fontSize: "6.5px",
                      lineHeight: 1.35,
                      color: "#111",
                    }}
                  >
                    {SELLER_ADDRESS}
                  </div>
                </td>
                <td style={{ ...outerCell(3, 1), padding: "6px 6px" }}>
                  <div
                    style={{
                      fontSize: "6.5px",
                      color: "#555",
                      marginBottom: 3,
                      lineHeight: 1.25,
                    }}
                  >
                    Order ID
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 700,
                      fontSize: "7px",
                      lineHeight: 1.25,
                      wordBreak: "break-all",
                      marginBottom: 4,
                    }}
                  >
                    {order.orderNumber}
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2px 0",
                      lineHeight: 1.15,
                    }}
                  >
                    <canvas
                      ref={orderBarRef}
                      data-barcode='order'
                      style={{
                        maxWidth: "100%",
                        display: "block",
                        margin: "0 auto",
                        verticalAlign: "middle",
                        imageRendering: "crisp-edges",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "6px",
                      textAlign: "center",
                      marginTop: 4,
                      lineHeight: 1.25,
                      paddingBottom: 2,
                    }}
                  >
                    {order.orderNumber}
                  </div>
                </td>
              </tr>

              {/* Products */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    ...outerCell(4, 0),
                    padding: "8px 4px 4px",
                    verticalAlign: "top",
                  }}
                >
                  <ProductLinesTable
                    order={order}
                    gridCell={gridCell}
                    slipInrItem={slipInrItem}
                  />
                </td>
              </tr>

              {/* Thin spacer before return block */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    ...outerCell(5, 0),
                    padding: "4px 0",
                    background: "#fff",
                    borderBottom: "none",
                  }}
                >
                  <div style={{ height: 2, fontSize: 1 }} aria-hidden>
                    {" "}
                  </div>
                </td>
              </tr>

              {/* Return — full width below all barcodes */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    ...outerCell(6, 0),
                    padding: "8px 6px",
                    background: "#fafafa",
                    borderTop: "2px solid #111",
                  }}
                >
                  <div
                    style={{
                      fontSize: "6.5px",
                      lineHeight: 1.45,
                      color: "#111",
                      fontWeight: 800,
                    }}
                  >
                    Return address
                  </div>
                  <div
                    style={{
                      fontSize: "6.5px",
                      lineHeight: 1.4,
                      color: "#111",
                      marginTop: 3,
                    }}
                  >
                    {RETURN_ADDRESS_TEXT}
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    ...outerCell(7, 0),
                    padding: "5px 6px",
                    background: "#fafafa",
                    borderTop: "none",
                    textAlign: "right",
                    fontSize: "7px",
                    color: "#666",
                  }}
                >
                  Page 1 of 1
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        <button
          type='button'
          onClick={() => void downloadPreviewPdf()}
          disabled={pdfBusy}
          className='inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900 shadow-sm hover:bg-brand-100 disabled:opacity-60'
        >
          <Download className='h-3.5 w-3.5 shrink-0' aria-hidden />
          {pdfBusy ? "Creating PDF…" : "Download PDF (matches preview)"}
        </button>
        <button
          type='button'
          onClick={openPrintWindow}
          className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:bg-slate-50'
        >
          <Printer className='h-3.5 w-3.5 shrink-0' aria-hidden />
          Print packing slip (4×6)
        </button>
        {/* <p className="text-[10px] text-gray-500 w-full text-center leading-snug">
          <span className="font-semibold text-gray-700">Download PDF (matches preview)</span> saves a true{' '}
          <span className="font-semibold text-gray-700">4×6 in (4R)</span> file — same size as Delhivery{' '}
          <code className="text-[9px] bg-slate-100 px-1 rounded">pdf_size=4R</code>. White label area is fitted inside the page; long orders shrink to fit.{' '}
          <span className="font-semibold text-gray-700">Delhivery PDF</span> above is their template. Print at 100% scale.
        </p> */}
      </div>
    </div>
  );
}
