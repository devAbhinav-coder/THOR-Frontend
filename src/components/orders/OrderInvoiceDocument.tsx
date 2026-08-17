import { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { orderInvoiceNumber } from "@/lib/documentNumbers";

type Props = {
  order: Order;
};

export default function OrderInvoiceDocument({ order }: Props) {
  const inPersonOffline =
    order.offlineMeta?.fulfillment === "offline_handover";

  // E-commerce Invoice format
  const invoiceNumber = orderInvoiceNumber(order.orderNumber);
  const invoiceDate = formatDate(order.invoice?.generatedAt || order.createdAt);
  const sellerDetails = {
    name: "The House of Rani",
    address: "Amrapali Princely State Sector 76, Noida, Uttar Pradesh 201301",
    email: "support@thehouseofrani.com",
    phone: "+91 8340311033",
    gstin: "10CCLPR1131E1Z6", // Display placeholder GSTIN for compliance look
    pan: "AAACCJ9379R", // Display placeholder PAN
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page { size: A4; margin: 0; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden; }
          #invoice-print-container, #invoice-print-container * {
            visibility: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #invoice-print-container {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 10mm 12mm 14mm;
            box-sizing: border-box;
            background: #fff !important;
            color: #111827 !important;
          }
          #invoice-print-inner {
            border: 0.75pt solid #9ca3af !important;
            padding: 6mm 7mm !important;
            box-sizing: border-box;
          }
          #invoice-print-container .overflow-x-auto {
            overflow: visible !important;
          }
          #invoice-print-container table {
            min-width: 0 !important;
            width: 100% !important;
          }
          #invoice-print-container thead tr {
            background-color: #f3f4f6 !important;
          }
          .invoice-grand-total-row {
            background-color: #f9fafb !important;
            color: #111827 !important;
          }
          .invoice-signature-block {
            background-color: #fff !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .invoice-signature-block .invoice-signature-title {
            color: #1f2937 !important;
          }
          .invoice-signature-block .invoice-signature-label {
            color: #4b5563 !important;
          }
          .invoice-signature-logo {
            opacity: 1 !important;
            filter: none !important;
          }
        }
      `,
        }}
      />
      <div
        id='invoice-print-container'
        className='mx-auto w-full max-w-[850px] bg-white text-black font-sans antialiased'
      >
        <div
          id='invoice-print-inner'
          className='border border-gray-400 p-6 sm:p-8'
        >
          {/* Header Section */}
          <div className='flex flex-col sm:flex-row justify-between items-start border-b border-gray-400 pb-2'>
            <div className='flex flex-col mb-2 sm:mb-0'>
              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='/logoNew.png'
                alt='The House of Rani Logo'
                className='h-10 w-auto object-contain mb-1 print:block'
              />
              <h1 className='text-xl font-bold uppercase tracking-wide text-gray-800'>
                Tax Invoice
              </h1>
              <p className='text-[10px] text-gray-500 font-medium tracking-tight'>
                Original for Recipient
              </p>
            </div>
            <div className='text-left sm:text-right text-xs text-gray-800 space-y-0.5 mt-1'>
              <p className='font-bold text-sm uppercase'>
                {sellerDetails.name}
              </p>
              <p className='text-xs max-w-[250px] sm:ml-auto'>
                {sellerDetails.address}
              </p>
              <p className='text-xs pt-1'>Email: {sellerDetails.email}</p>
              <p className='text-xs'>Ph: {sellerDetails.phone}</p>
              <p className='text-xs font-semibold pt-1'>
                GSTIN: {sellerDetails.gstin}
              </p>
              {/* <p className="text-xs text-gray-600">PAN: {sellerDetails.pan}</p> */}
            </div>
          </div>

          {/* Invoice Info & Addresses */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-b border-gray-400 pb-2 mb-2'>
            {/* Order Details */}
            <div className='text-xs space-y-0.5'>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Order Number:
                </span>{" "}
                {order.orderNumber}
              </p>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Order Date:
                </span>{" "}
                {formatDate(order.createdAt)}
              </p>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Invoice Number:
                </span>{" "}
                {invoiceNumber}
              </p>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Invoice Date:
                </span>{" "}
                {invoiceDate}
              </p>
            </div>

            <div className='text-xs space-y-0.5'>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Payment Method:
                </span>{" "}
                {order.paymentMethod === "cod" ?
                  "Cash on Delivery"
                : order.paymentMethod === "offline_upi" ?
                  "Offline — UPI"
                : order.paymentMethod === "offline_cash" ?
                  "Offline — cash"
                : "Online"}
              </p>
              <p>
                <span className='font-semibold inline-block w-28'>
                  Payment Status:
                </span>{" "}
                <span className='capitalize'>{order.paymentStatus}</span>
              </p>
              {order.razorpayPaymentId && (
                <p>
                  <span className='font-semibold inline-block w-28'>
                    Transaction ID:
                  </span>{" "}
                  {order.razorpayPaymentId}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-3'>
            {/* Billing Info */}
            <div>
              <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5'>
                Billed To
              </h2>
              <p className='font-bold text-xs tracking-tight'>
                {order.shippingAddress?.name || "Customer"}
              </p>
              <div className='text-xs text-gray-700 mt-0.5 leading-snug'>
                {inPersonOffline ?
                  <>
                    {order.shippingAddress?.phone && (
                      <p>Phone: +91 {order.shippingAddress.phone}</p>
                    )}
                  </>
                : <>
                    {order.shippingAddress?.house && (
                      <p>{order.shippingAddress.house}</p>
                    )}
                    <p>{order.shippingAddress?.street}</p>
                    {order.shippingAddress?.landmark && (
                      <p>Landmark: {order.shippingAddress.landmark}</p>
                    )}
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state}
                    </p>
                    <p>
                      {order.shippingAddress?.country} -{" "}
                      {order.shippingAddress?.pincode}
                    </p>
                    {order.shippingAddress?.phone && (
                      <p>Phone: +91 {order.shippingAddress.phone}</p>
                    )}
                  </>
                }
              </div>
            </div>

            {/* Shipping Info */}
            <div>
              <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5'>
                {inPersonOffline ? "Fulfilment" : "Shipped To"}
              </h2>
              <p className='font-bold text-xs tracking-tight'>
                {inPersonOffline ? "" : (order.shippingAddress?.name || "Customer")}
              </p>
              <div className='text-xs text-gray-700 mt-0.5 leading-snug'>
                {inPersonOffline ?
                  null
                : <>
                    {order.shippingAddress?.house && (
                      <p>{order.shippingAddress.house}</p>
                    )}
                    <p>{order.shippingAddress?.street}</p>
                    {order.shippingAddress?.landmark && (
                      <p>Landmark: {order.shippingAddress.landmark}</p>
                    )}
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state}
                    </p>
                    <p>
                      {order.shippingAddress?.country} -{" "}
                      {order.shippingAddress?.pincode}
                    </p>
                    {order.shippingAddress?.phone && (
                      <p>Phone: +91 {order.shippingAddress.phone}</p>
                    )}
                  </>
                }
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className='overflow-x-auto border border-gray-400 rounded-sm'>
            <table className='w-full text-xs border-collapse min-w-[600px]'>
              <thead>
                <tr className='bg-gray-100/80 text-gray-800 uppercase text-[9px] tracking-wider font-bold'>
                  <th className='border-b border-r border-gray-400 py-1.5 px-2 text-left w-12'>
                    S.No.
                  </th>
                  <th className='border-b border-r border-gray-400 py-1.5 px-2 text-left'>
                    Description
                  </th>
                  <th className='border-b border-r border-gray-400 py-1.5 px-2 text-right'>
                    Unit Price
                  </th>
                  <th className='border-b border-r border-gray-400 py-1.5 px-2 text-center w-16'>
                    Qty
                  </th>
                  <th className='border-b border-gray-400 py-1.5 px-2 text-right w-28'>
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr
                    key={`${item.name}-${i}`}
                    className='text-gray-800 align-top'
                  >
                    <td className='border-b border-r border-gray-300 py-1.5 px-2 text-gray-600 font-medium'>
                      {i + 1}
                    </td>
                    <td className='border-b border-r border-gray-300 py-1.5 px-2'>
                      <p className='font-semibold text-gray-900 leading-tight'>
                        {item.name}
                      </p>
                      <p className='text-[10px] text-gray-500 mt-0.5'>
                        {[
                          item.variant?.size,
                          item.variant?.color,
                          item.variant?.sku ? `SKU: ${item.variant.sku}` : null,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    </td>
                    <td className='border-b border-r border-gray-300 py-1.5 px-2 text-right tabular-nums'>
                      {formatPrice(item.price)}
                    </td>
                    <td className='border-b border-r border-gray-300 py-1.5 px-2 text-center'>
                      {item.quantity}
                    </td>
                    <td className='border-b border-gray-300 py-1.5 px-2 text-right font-medium tabular-nums'>
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Signature */}
          <div className='flex flex-col sm:flex-row gap-4 mt-2'>
            <div className='flex-1 pt-1 text-[10px] text-gray-600 order-2 sm:order-1'>
              <h4 className='font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1'>
                Declaration:
              </h4>
              <p className='leading-tight'>
                We declare that this invoice shows the actual price of the goods
                described and that all particulars are true and correct.
              </p>
              {(order.shippingCharge > 0 || (order.codFee || 0) > 0) && (
                <p className='mt-2 leading-tight text-[8px] text-gray-500'>
                  Note: Shipping and COD handling charges (if shown) are not
                  refundable on approved returns; refunds apply to product value
                  as per our Terms.
                </p>
              )}
            </div>

            <div className='w-full sm:w-[260px] border border-gray-400 rounded-sm order-1 sm:order-2 shrink-0'>
              <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                <span className='text-gray-600 font-medium'>Subtotal</span>
                <span className='tabular-nums font-medium'>
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200 text-green-700'>
                  <span className='font-medium'>Discount applied</span>
                  <span className='tabular-nums font-medium'>
                    - {formatPrice(order.discount || 0)}
                  </span>
                </div>
              )}
              <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                <span className='text-gray-600 font-medium'>
                  Shipping Charge
                </span>
                <span className='tabular-nums font-medium'>
                  {order.shippingCharge === 0 ?
                    "Free"
                  : formatPrice(order.shippingCharge || 0)}
                </span>
              </div>
              {(order.codFee || 0) > 0 && (
                <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-200'>
                  <span className='text-gray-600 font-medium'>
                    COD handling fee
                  </span>
                  <span className='tabular-nums font-medium'>
                    {formatPrice(order.codFee || 0)}
                  </span>
                </div>
              )}
              <div className='flex justify-between py-1.5 px-2 text-xs border-b border-gray-400'>
                <span className='text-gray-600 font-medium'>Tax</span>
                <span className='tabular-nums font-medium'>
                  {formatPrice(order.tax || 0)}
                </span>
              </div>
              <div className='flex justify-between py-2 px-2 bg-gray-50 text-sm font-bold text-gray-900 border-b border-gray-400 invoice-grand-total-row'>
                <span>Grand Total</span>
                <span className='tabular-nums'>{formatPrice(order.total)}</span>
              </div>

              {/* Signature Block */}
              <div className='p-2 flex flex-col items-center justify-end min-h-[70px] bg-white rounded-b-sm invoice-signature-block'>
                <div className='w-full border-b border-gray-400 mb-1 pb-1 flex flex-col items-center justify-center text-center'>
                  <span className='font-serif text-[10px] text-gray-800 font-bold uppercase tracking-wider mb-1 invoice-signature-title'>
                    For The House of Rani
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src='/logoNew.png'
                    alt='The House of Rani'
                    className='h-7 w-auto mb-0.5 invoice-signature-logo'
                  />
                </div>
                <p className='text-[8px] uppercase font-bold text-gray-600 tracking-wider invoice-signature-label'>
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-4 pt-2 border-t border-gray-300 text-[8px] text-gray-500 text-center leading-tight'>
            <p className='font-semibold text-gray-700 mb-0.5'>Return Policy:</p>
            <p>
              Please inspect goods immediately upon delivery. Returns are
              subject to our verified policy terms within 5 days of receipt.
            </p>
            <p className='mt-0.5 uppercase tracking-wider font-semibold text-gray-400'>
              This is a computer generated invoice and does not require a
              physical signature.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
