import { cn, formatDateTime } from "@/lib/utils";
import {
  computeLine,
  computeTotals,
  formatINRMoney,
  rupeesInWords,
  type InvoiceLine,
  type TaxMode,
} from "@/lib/invoiceCalc";

export type SellerDetails = {
  name: string;
  address: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  state: string;
};

export type BuyerDetails = {
  name: string;
  companyName: string;
  gstin: string;
  pan: string;
  address: string;
  state: string;
  phone: string;
  email: string;
};

export type InvoiceMeta = {
  invoiceNumber: string;
  /** ISO date string (yyyy-mm-dd). */
  invoiceDate: string;
  /** ISO date string (yyyy-mm-dd) or empty. */
  dueDate: string;
  poNumber: string;
  notes: string;
  terms: string;
  taxMode: TaxMode;
  showHsn: boolean;
  showDiscount: boolean;
  /** When taxMode === 'cgst_sgst' or 'igst': show GST columns/rows. */
  showGstColumn: boolean;
};

type Props = {
  seller: SellerDetails;
  buyer: BuyerDetails;
  meta: InvoiceMeta;
  lines: InvoiceLine[];
  /** When set (ISO from server), shown on the PDF as when this record was first saved. */
  recordCreatedAt?: string | null;
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

/**
 * Print-ready B2B tax invoice (GST / non-GST). Used only for admin-generated
 * bills — no storefront order or shipping fields.
 */
export default function SalesInvoiceDocument({
  seller,
  buyer,
  meta,
  lines,
  recordCreatedAt,
}: Props) {
  const lineRows = Array.isArray(lines) ? lines : [];
  const totals = computeTotals(lineRows, meta.taxMode);
  const computedLines = lineRows.map((l) => ({
    line: l,
    c: computeLine(l, meta.taxMode),
  }));
  const showTax = meta.taxMode !== "none" && meta.showGstColumn;
  const showCgstSgst = meta.taxMode === "cgst_sgst";
  const showIgst = meta.taxMode === "igst";

  /** Match the buyer-state prompt to the chosen tax mode for an at-a-glance sanity check. */
  const placeOfSupply = buyer.state || "—";

  /** Column count for the colspan on the totals row of an empty invoice. */
  const colCount =
    2 + // S.No + Description
    (meta.showHsn ? 1 : 0) +
    1 + // Unit
    1 + // Qty
    1 + // Rate
    (meta.showDiscount ? 1 : 0) +
    (showTax ? 2 : 0) + // GST % + GST ₹
    1; // Amount

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Browser margin (URL, date, title) is NOT controllable from CSS —
           only from Print → "Headers and footers" off. We still draw a clear
           frame around the invoice content itself in the PDF. */
        @page { size: A4; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden; }
          #sales-invoice-print-container, #sales-invoice-print-container * { visibility: visible; }
          #sales-invoice-print-container {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 10mm 12mm 24mm;
            box-sizing: border-box;
            overflow: visible;
            border: 0.75pt solid #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-print-page-footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 8mm;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            visibility: visible;
          }
          .invoice-print-page-footer::after {
            content: counter(page);
          }
          .print-hidden { display: none !important; }
          /* Force the items-table wrapper to never scroll in print and the
             table to fit page width — kills the horizontal scrollbar that
             Chrome otherwise rasterises into the saved PDF. */
          #sales-invoice-print-container .overflow-x-auto {
            overflow: visible !important;
          }
          #sales-invoice-print-container table {
            min-width: 0 !important;
            width: 100% !important;
            table-layout: fixed !important;
            break-inside: auto;
          }
          #sales-invoice-print-container thead { display: table-header-group; }
          #sales-invoice-print-container tfoot { display: table-footer-group; }
          #sales-invoice-print-container td,
          #sales-invoice-print-container th {
            word-break: break-word;
            overflow-wrap: anywhere;
          }
        }
      `,
        }}
      />
      <div
        id='sales-invoice-print-container'
        className='mx-auto w-full max-w-[850px] bg-white text-black font-sans antialiased print:max-w-none print:w-full'
      >
        <div className='border border-gray-400 p-6 sm:p-8 print:border-0 print:p-5'>
          {/* Header — seller block + invoice meta */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-gray-400 pb-3'>
            <div className='flex flex-col'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='/logoNew.png'
                alt={`${seller.name} logo`}
                className='h-10 w-auto object-contain mb-1'
              />
              <h1 className='text-xl font-bold uppercase tracking-wide text-gray-800'>
                Tax Invoice
              </h1>
              <p className='text-[10px] text-gray-500 font-medium tracking-tight'>
                Original for Recipient
              </p>
            </div>
            <div className='text-left sm:text-right text-xs text-gray-800 space-y-0.5'>
              <p className='font-bold text-sm uppercase'>{seller.name}</p>
              <p className='text-xs max-w-[260px] sm:ml-auto whitespace-pre-line'>
                {seller.address}
              </p>
              {seller.email ?
                <p className='text-xs pt-1'>Email: {seller.email}</p>
              : null}
              {seller.phone ? <p className='text-xs'>Ph: {seller.phone}</p> : null}
              <div className='mt-1 flex flex-col items-start sm:items-end gap-0.5'>
                {seller.gstin ?
                  <p className='text-xs font-semibold'>
                    GSTIN: {seller.gstin}
                  </p>
                : null}
                {seller.pan ? (
                  <p className='text-[11px] text-gray-600'>PAN: {seller.pan}</p>
                ) : null}
                {seller.state ? (
                  <p className='text-[11px] text-gray-600'>
                    State: {seller.state}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Invoice meta strip */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 border-b border-gray-400 pb-3'>
            <div className='text-xs space-y-0.5'>
              <p>
                <span className='font-semibold inline-block w-32'>
                  Invoice Number:
                </span>
                {meta.invoiceNumber || "—"}
              </p>
              <p>
                <span className='font-semibold inline-block w-32'>
                  Invoice Date:
                </span>
                {fmtDate(meta.invoiceDate)}
              </p>
              {recordCreatedAt?.trim() ? (
                <p>
                  <span className='font-semibold inline-block w-32'>
                    Created on:
                  </span>
                  {formatDateTime(recordCreatedAt.trim())}
                </p>
              ) : null}
              {meta.dueDate ? (
                <p>
                  <span className='font-semibold inline-block w-32'>
                    Due Date:
                  </span>
                  {fmtDate(meta.dueDate)}
                </p>
              ) : null}
              {meta.poNumber ? (
                <p>
                  <span className='font-semibold inline-block w-32'>
                    PO / Reference:
                  </span>
                  {meta.poNumber}
                </p>
              ) : null}
            </div>
            <div className='text-xs space-y-0.5 sm:text-right'>
              <p>
                <span className='font-semibold inline-block w-32 text-left'>
                  Tax type:
                </span>
                {meta.taxMode === "cgst_sgst" ?
                  "CGST + SGST (intra-state)"
                : meta.taxMode === "igst" ?
                  "IGST (inter-state)"
                : "Non-GST"}
              </p>
              {meta.taxMode !== "none" ? (
                <p>
                  <span className='font-semibold inline-block w-32 text-left'>
                    Place of supply:
                  </span>
                  {placeOfSupply}
                </p>
              ) : null}
            </div>
          </div>

          {/* Buyer block — second column (tax details) auto-hides when buyer has no GSTIN/PAN */}
          {(() => {
            const hasBuyerTax = Boolean(
              buyer.gstin?.trim() || buyer.pan?.trim(),
            );
            return (
              <div
                className={cn(
                  "grid grid-cols-1 gap-6 my-3",
                  hasBuyerTax && "sm:grid-cols-2",
                )}
              >
                <div>
                  <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5'>
                    Billed To
                  </h2>
                  <p className='font-bold text-sm tracking-tight'>
                    {buyer.companyName?.trim() ||
                      buyer.name?.trim() ||
                      "Customer"}
                  </p>
                  {buyer.companyName?.trim() && buyer.name?.trim() ? (
                    <p className='text-xs text-gray-700 mt-0.5'>
                      Attn: {buyer.name}
                    </p>
                  ) : null}
                  {buyer.address?.trim() ? (
                    <div className='text-xs text-gray-700 mt-0.5 leading-snug whitespace-pre-line'>
                      {buyer.address}
                    </div>
                  ) : null}
                  <div className='text-xs text-gray-700 mt-1 space-y-0.5'>
                    {buyer.state ? <p>State: {buyer.state}</p> : null}
                    {buyer.phone ? <p>Phone: {buyer.phone}</p> : null}
                    {buyer.email ? <p>Email: {buyer.email}</p> : null}
                  </div>
                </div>
                {hasBuyerTax ? (
                  <div>
                    <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5'>
                      Buyer Tax Details
                    </h2>
                    <div className='text-xs text-gray-700 mt-0.5 leading-snug space-y-0.5'>
                      {buyer.gstin?.trim() ? (
                        <p>
                          <span className='font-semibold inline-block w-20'>
                            GSTIN:
                          </span>
                          {buyer.gstin}
                        </p>
                      ) : null}
                      {buyer.pan?.trim() ? (
                        <p>
                          <span className='font-semibold inline-block w-20'>
                            PAN:
                          </span>
                          {buyer.pan}
                        </p>
                      ) : null}
                    </div>
                    {meta.poNumber ? (
                      <p className='mt-2 text-[11px] text-gray-600'>
                        Reference: {meta.poNumber}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })()}

          {/*
            Items table — screen lets the inner table grow + horizontal-scroll
            inside the bordered card; print forces it back to the page width
            so the saved PDF has NO horizontal scroll bar and shows every
            column. Block borders (full grid) on every cell.
          */}
          <div className='overflow-x-auto border border-gray-400 rounded-sm print:overflow-visible'>
            <table className='w-full text-[11px] border-collapse min-w-[640px] print:min-w-0 print:w-full print:table-fixed print:text-[10px]'>
              <colgroup>
                <col className='w-8 print:w-[6%]' />
                <col className='print:w-auto' />
                {meta.showHsn ? <col className='w-16 print:w-[10%]' /> : null}
                <col className='w-12 print:w-[8%]' />
                <col className='w-12 print:w-[7%]' />
                <col className='w-20 print:w-[11%]' />
                {meta.showDiscount ? (
                  <col className='w-12 print:w-[7%]' />
                ) : null}
                {showTax ? (
                  <>
                    <col className='w-12 print:w-[7%]' />
                    <col className='w-20 print:w-[11%]' />
                  </>
                ) : null}
                <col className='w-24 print:w-[14%]' />
              </colgroup>
              <thead>
                <tr className='bg-gray-100/80 text-gray-800 uppercase text-[9px] tracking-wider font-bold'>
                  <th className='border border-gray-400 py-1.5 px-1.5 text-left'>
                    #
                  </th>
                  <th className='border border-gray-400 py-1.5 px-2 text-left'>
                    Description
                  </th>
                  {meta.showHsn ? (
                    <th className='border border-gray-400 py-1.5 px-1.5 text-left'>
                      HSN/SAC
                    </th>
                  ) : null}
                  <th className='border border-gray-400 py-1.5 px-1.5 text-center'>
                    Unit
                  </th>
                  <th className='border border-gray-400 py-1.5 px-1.5 text-center'>
                    Qty
                  </th>
                  <th className='border border-gray-400 py-1.5 px-1.5 text-right'>
                    Rate
                  </th>
                  {meta.showDiscount ? (
                    <th className='border border-gray-400 py-1.5 px-1.5 text-right'>
                      Disc%
                    </th>
                  ) : null}
                  {showTax ? (
                    <>
                      <th className='border border-gray-400 py-1.5 px-1.5 text-right'>
                        GST%
                      </th>
                      <th className='border border-gray-400 py-1.5 px-1.5 text-right'>
                        GST ₹
                      </th>
                    </>
                  ) : null}
                  <th className='border border-gray-400 py-1.5 px-1.5 text-right'>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedLines.length === 0 ?
                  <tr>
                    <td
                      colSpan={colCount}
                      className='border border-gray-400 py-6 text-center text-gray-400 text-xs italic'
                    >
                      No line items yet — add rows from the editor on the left.
                    </td>
                  </tr>
                : computedLines.map(({ line, c }, i) => (
                    <tr key={line.id} className='text-gray-800 align-top'>
                      <td className='border border-gray-400 py-1.5 px-1.5 text-gray-600 font-medium'>
                        {i + 1}
                      </td>
                      <td className='border border-gray-400 py-1.5 px-2 break-words'>
                        <p className='font-semibold text-gray-900 leading-tight'>
                          {line.description.trim() || (
                            <span className='italic text-gray-400'>
                              (no description)
                            </span>
                          )}
                        </p>
                      </td>
                      {meta.showHsn ? (
                        <td className='border border-gray-400 py-1.5 px-1.5 text-left tabular-nums text-gray-700'>
                          {line.hsn || "—"}
                        </td>
                      ) : null}
                      <td className='border border-gray-400 py-1.5 px-1.5 text-center text-gray-700'>
                        {c.unitLabel}
                      </td>
                      <td className='border border-gray-400 py-1.5 px-1.5 text-center tabular-nums'>
                        {line.qty}
                      </td>
                      <td className='border border-gray-400 py-1.5 px-1.5 text-right tabular-nums'>
                        {formatINRMoney(line.rate)}
                      </td>
                      {meta.showDiscount ? (
                        <td className='border border-gray-400 py-1.5 px-1.5 text-right tabular-nums'>
                          {line.discountPct ? `${line.discountPct}%` : "—"}
                        </td>
                      ) : null}
                      {showTax ? (
                        <>
                          <td className='border border-gray-400 py-1.5 px-1.5 text-right tabular-nums'>
                            {line.gstPct ? `${line.gstPct}%` : "—"}
                          </td>
                          <td className='border border-gray-400 py-1.5 px-1.5 text-right tabular-nums'>
                            {formatINRMoney(c.gstAmt)}
                          </td>
                        </>
                      ) : null}
                      <td className='border border-gray-400 py-1.5 px-1.5 text-right font-medium tabular-nums'>
                        {formatINRMoney(c.total)}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Totals + signature */}
          <div className='flex flex-col sm:flex-row gap-4 mt-3'>
            <div className='flex-1 pt-1 text-[10px] text-gray-700 order-2 sm:order-1 space-y-2'>
              <div>
                <h4 className='font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1'>
                  Amount in Words
                </h4>
                <p className='text-[11px] font-semibold text-gray-900 leading-snug'>
                  {rupeesInWords(totals.grandTotal)}
                </p>
              </div>
              {meta.notes ? (
                <div>
                  <h4 className='font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1'>
                    Notes
                  </h4>
                  <p className='leading-tight whitespace-pre-line'>
                    {meta.notes}
                  </p>
                </div>
              ) : null}
              {meta.terms ? (
                <div>
                  <h4 className='font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1'>
                    Terms &amp; Conditions
                  </h4>
                  <p className='leading-tight whitespace-pre-line'>
                    {meta.terms}
                  </p>
                </div>
              ) : null}
              <div>
                <h4 className='font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1'>
                  Declaration
                </h4>
                <p className='leading-tight'>
                  We declare that this invoice shows the actual price of the
                  goods described and that all particulars are true and correct.
                </p>
              </div>
            </div>

            <div className='w-full sm:w-[280px] border border-gray-400 rounded-sm order-1 sm:order-2 shrink-0'>
              <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                <span className='text-gray-600 font-medium'>Subtotal</span>
                <span className='tabular-nums font-medium'>
                  {formatINRMoney(totals.subTotal)}
                </span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200 text-emerald-700'>
                  <span className='font-medium'>Discount</span>
                  <span className='tabular-nums font-medium'>
                    − {formatINRMoney(totals.totalDiscount)}
                  </span>
                </div>
              )}
              {showCgstSgst && totals.cgst > 0 ? (
                <>
                  <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                    <span className='text-gray-600 font-medium'>CGST</span>
                    <span className='tabular-nums font-medium'>
                      {formatINRMoney(totals.cgst)}
                    </span>
                  </div>
                  <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                    <span className='text-gray-600 font-medium'>SGST</span>
                    <span className='tabular-nums font-medium'>
                      {formatINRMoney(totals.sgst)}
                    </span>
                  </div>
                </>
              ) : null}
              {showIgst && totals.igst > 0 ? (
                <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                  <span className='text-gray-600 font-medium'>IGST</span>
                  <span className='tabular-nums font-medium'>
                    {formatINRMoney(totals.igst)}
                  </span>
                </div>
              ) : null}
              {Math.abs(totals.roundOff) >= 0.005 && (
                <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200 text-gray-600'>
                  <span className='font-medium'>Round-off</span>
                  <span className='tabular-nums font-medium'>
                    {totals.roundOff > 0 ? "+ " : "− "}
                    {formatINRMoney(Math.abs(totals.roundOff))}
                  </span>
                </div>
              )}
              <div className='flex justify-between py-2 px-2 bg-gray-50 text-sm font-bold text-gray-900 border-b border-gray-400'>
                <span>Grand Total</span>
                <span className='tabular-nums'>
                  {formatINRMoney(totals.grandTotal)}
                </span>
              </div>

              <div className='p-2 flex flex-col items-center justify-end min-h-[80px] bg-white rounded-b-sm'>
                <div className='w-full border-b border-gray-300 mb-1 pb-1 flex flex-col items-center justify-center text-center'>
                  <span className='font-serif text-[10px] text-gray-800 font-bold uppercase tracking-wider mb-1'>
                    For {seller.name}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src='/logo.png'
                    alt='Stamp'
                    className='h-6 w-auto opacity-70 grayscale mb-0.5'
                  />
                </div>
                <p className='text-[8px] uppercase font-bold text-gray-500 tracking-wider'>
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>

          <div className='mt-4 pt-2 border-t border-gray-300 text-[8px] text-gray-500 text-center leading-tight'>
            <p className='uppercase tracking-wider font-semibold text-gray-400'>
              This is a computer generated invoice and does not require a
              physical signature.
            </p>
          </div>
          {/* In-document page # (Chrome/Firefox paged counter). Browser margin URL/title is separate — disable "Headers and footers" in print. */}
          <div
            className='invoice-print-page-footer hidden print:block'
            aria-hidden
          />
        </div>
      </div>
    </>
  );
}
