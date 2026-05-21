"use client";

import { formatDate, formatPrice } from "@/lib/utils";
import {
  amountInWordsIndian,
  supplyTypeLabel,
  type PurchaseInvoice,
} from "./purchaseInvoiceUtils";

type Props = {
  invoice: PurchaseInvoice;
  /** Your business name shown as "Bill To / Received By" reference */
  businessName?: string;
  className?: string;
};

/**
 * Print-ready purchase bill (GSTR-2 style) — supplier as seller, your store as buyer.
 */
export default function PurchaseInvoiceDocument({
  invoice,
  businessName = "The House of Rani",
  className = "",
}: Props) {
  const isIntra = invoice.supplyType === "intra";
  const balance =
    invoice.paymentStatus === "paid" ?
      0
    : Math.max(0, invoice.grandTotal - (invoice.paidAmount ?? 0));

  return (
    <div
      className={`bg-white text-gray-900 text-sm print:text-black ${className}`}
      id='purchase-invoice-print'
    >
      <div className='border border-gray-200 rounded-xl overflow-hidden'>
        <div className='bg-navy-900 text-white px-5 py-4 flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-white/70 font-semibold'>
              Purchase Invoice
            </p>
            <h2 className='text-lg font-bold mt-0.5'>{invoice.supplierName}</h2>
            {invoice.supplierGstin && (
              <p className='text-xs font-mono mt-1 text-white/90'>
                GSTIN: {invoice.supplierGstin}
              </p>
            )}
          </div>
          <div className='text-right text-xs space-y-0.5'>
            <p>
              <span className='text-white/60'>Invoice No.</span>{" "}
              <span className='font-bold font-mono'>
                {invoice.invoiceNumber}
              </span>
            </p>
            <p>
              <span className='text-white/60'>Date</span>{" "}
              <span className='font-semibold'>
                {formatDate(invoice.invoiceDate)}
              </span>
            </p>
            <p>
              <span className='text-white/60'>Supply</span>{" "}
              <span className='font-semibold'>
                {supplyTypeLabel(invoice.supplyType)}
              </span>
            </p>
          </div>
        </div>

        <div className='px-5 py-3 border-b border-gray-100 grid sm:grid-cols-2 gap-3 text-xs'>
          <div>
            <p className='text-[10px] font-bold text-gray-400 uppercase'>
              Bill To{" "}
            </p>
            <p className='font-semibold text-gray-900 mt-0.5'>{businessName}</p>
          </div>
          <div className='sm:text-right'>
            <p className='text-[10px] font-bold text-gray-400 uppercase'>
              Payment
            </p>
            <p className='font-semibold capitalize mt-0.5'>
              {invoice.paymentStatus}
            </p>
            {invoice.paymentStatus === "partial" && (
              <p className='text-gray-600'>
                Paid {formatPrice(invoice.paidAmount)} · Balance{" "}
                {formatPrice(balance)}
              </p>
            )}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-xs min-w-[640px]'>
            <thead>
              <tr className='bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500'>
                <th className='text-left px-3 py-2 w-8'>#</th>
                <th className='text-left px-3 py-2'>Description</th>
                <th className='text-left px-3 py-2'>HSN</th>
                <th className='text-right px-3 py-2'>Qty</th>
                <th className='text-right px-3 py-2'>Rate ₹</th>
                <th className='text-right px-3 py-2'>Taxable</th>
                <th className='text-right px-3 py-2'>GST%</th>
                {isIntra ?
                  <>
                    <th className='text-right px-3 py-2'>CGST</th>
                    <th className='text-right px-3 py-2'>SGST</th>
                  </>
                : <th className='text-right px-3 py-2'>IGST</th>}
                <th className='text-right px-3 py-2'>Amount</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {invoice.lineItems.map((l, i) => (
                <tr key={i}>
                  <td className='px-3 py-2 text-gray-500'>{i + 1}</td>
                  <td className='px-3 py-2'>
                    <p className='font-medium text-gray-900'>{l.productName}</p>
                    <p className='text-gray-500 font-mono text-[10px]'>
                      {l.sku}
                      {l.variantLabel ? ` · ${l.variantLabel}` : ""}
                    </p>
                  </td>
                  <td className='px-3 py-2 font-mono text-gray-600'>
                    {l.hsn || "—"}
                  </td>
                  <td className='px-3 py-2 text-right'>{l.quantity}</td>
                  <td className='px-3 py-2 text-right'>
                    {formatPrice(l.unitCost)}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {formatPrice(l.taxableAmount)}
                  </td>
                  <td className='px-3 py-2 text-right'>{l.gstRate}%</td>
                  {isIntra ?
                    <>
                      <td className='px-3 py-2 text-right text-blue-700'>
                        {formatPrice(l.cgst)}
                      </td>
                      <td className='px-3 py-2 text-right text-purple-700'>
                        {formatPrice(l.sgst)}
                      </td>
                    </>
                  : <td className='px-3 py-2 text-right text-orange-700'>
                      {formatPrice(l.igst)}
                    </td>
                  }
                  <td className='px-3 py-2 text-right font-semibold'>
                    {formatPrice(l.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='px-5 py-4 grid sm:grid-cols-2 gap-4 border-t border-gray-100'>
          <div className='text-xs text-gray-600 space-y-1'>
            {invoice.notes && (
              <p>
                <span className='font-semibold text-gray-800'>Notes:</span>{" "}
                {invoice.notes}
              </p>
            )}
            <p className='italic text-gray-500'>
              {amountInWordsIndian(invoice.grandTotal)}
            </p>
            {invoice.createdBy?.name && (
              <p className='text-[10px] text-gray-400 pt-2'>
                Recorded by {invoice.createdBy.name}
                {invoice.createdAt ? ` · ${formatDate(invoice.createdAt)}` : ""}
              </p>
            )}
          </div>
          <div className='text-xs space-y-1 sm:ml-auto sm:max-w-xs w-full'>
            <div className='flex justify-between'>
              <span className='text-gray-500'>Taxable Value</span>
              <span className='font-semibold'>
                {formatPrice(invoice.totalTaxable)}
              </span>
            </div>
            {isIntra ?
              <>
                <div className='flex justify-between text-blue-700'>
                  <span>CGST</span>
                  <span className='font-semibold'>
                    {formatPrice(invoice.totalCgst)}
                  </span>
                </div>
                <div className='flex justify-between text-purple-700'>
                  <span>SGST</span>
                  <span className='font-semibold'>
                    {formatPrice(invoice.totalSgst)}
                  </span>
                </div>
              </>
            : <div className='flex justify-between text-orange-700'>
                <span>IGST</span>
                <span className='font-semibold'>
                  {formatPrice(invoice.totalIgst)}
                </span>
              </div>
            }
            <div className='flex justify-between border-t border-gray-200 pt-2 mt-2'>
              <span className='font-bold text-gray-900'>Grand Total</span>
              <span className='font-bold text-lg text-navy-900'>
                {formatPrice(invoice.grandTotal)}
              </span>
            </div>
            {balance > 0 && (
              <div className='flex justify-between text-red-600 font-semibold'>
                <span>Balance Payable</span>
                <span>{formatPrice(balance)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
