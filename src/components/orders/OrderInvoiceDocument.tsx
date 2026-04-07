import { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  order: Order;
};

export default function OrderInvoiceDocument({ order }: Props) {
  // E-commerce Invoice format
  const invoiceNumber = `INV-${order.orderNumber}`;
  const invoiceDate = formatDate(order.invoice?.generatedAt || order.createdAt);
  const sellerDetails = {
    name: "The House of Rani",
    address: "Amrapali Princely State Sector 76, Noida, Uttar Pradesh 201301",
    email: "support@thehouseofrani.com",
    phone: "+91 8340311033",
    gstin: "09AAACCJ9379R1Z2", // Display placeholder GSTIN for compliance look
    pan: "AAACCJ9379R",      // Display placeholder PAN
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-container, #invoice-print-container * {
            visibility: visible;
          }
          #invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
      <div id="invoice-print-container" className="mx-auto w-full max-w-[850px] bg-white text-black print:max-w-none print:w-full font-sans antialiased">
        <div className="border border-gray-400 p-6 sm:p-8 print:p-0 print:border-none">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-400 pb-2">
          <div className="flex flex-col mb-2 sm:mb-0">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="The House of Rani Logo" 
              className="h-10 w-auto object-contain mb-1 print:block"
            />
            <h1 className="text-xl font-bold uppercase tracking-wide text-gray-800">Tax Invoice</h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Original for Recipient</p>
          </div>
          <div className="text-left sm:text-right text-xs text-gray-800 space-y-0.5 mt-1">
            <p className="font-bold text-sm uppercase">{sellerDetails.name}</p>
            <p className="text-xs max-w-[250px] sm:ml-auto">{sellerDetails.address}</p>
            <p className="text-xs pt-1">Email: {sellerDetails.email}</p>
            <p className="text-xs">Ph: {sellerDetails.phone}</p>
            {/* <p className="text-xs font-semibold pt-1">GSTIN: {sellerDetails.gstin}</p>
            <p className="text-xs text-gray-600">PAN: {sellerDetails.pan}</p> */}
          </div>
        </div>

        {/* Invoice Info & Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-b border-gray-400 pb-2 mb-2">
          {/* Order Details */}
          <div className="text-xs space-y-0.5">
            <p><span className="font-semibold inline-block w-28">Order Number:</span> {order.orderNumber}</p>
            <p><span className="font-semibold inline-block w-28">Order Date:</span> {formatDate(order.createdAt)}</p>
            <p><span className="font-semibold inline-block w-28">Invoice Number:</span> {invoiceNumber}</p>
            <p><span className="font-semibold inline-block w-28">Invoice Date:</span> {invoiceDate}</p>
          </div>

          <div className="text-xs space-y-0.5">
            <p><span className="font-semibold inline-block w-28">Payment Method:</span> {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}</p>
            <p><span className="font-semibold inline-block w-28">Payment Status:</span> <span className="capitalize">{order.paymentStatus}</span></p>
            {order.razorpayPaymentId && (
               <p><span className="font-semibold inline-block w-28">Transaction ID:</span> {order.razorpayPaymentId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-3">
          {/* Billing Info */}
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5">Billed To</h2>
            <p className="font-bold text-xs tracking-tight">{order.shippingAddress?.name || "Customer"}</p>
            <div className="text-xs text-gray-700 mt-0.5 leading-snug">
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p>{order.shippingAddress?.country} - {order.shippingAddress?.pincode}</p>
              {order.shippingAddress?.phone && <p>Phone: +91 {order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 border-b border-gray-300 pb-0.5">Shipped To</h2>
            <p className="font-bold text-xs tracking-tight">{order.shippingAddress?.name || "Customer"}</p>
            <div className="text-xs text-gray-700 mt-0.5 leading-snug">
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p>{order.shippingAddress?.country} - {order.shippingAddress?.pincode}</p>
              {order.shippingAddress?.phone && <p>Phone: +91 {order.shippingAddress.phone}</p>}
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto border border-gray-400 rounded-sm">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100/80 text-gray-800 uppercase text-[9px] tracking-wider font-bold">
                <th className="border-b border-r border-gray-400 py-1.5 px-2 text-left w-12">S.No.</th>
                <th className="border-b border-r border-gray-400 py-1.5 px-2 text-left">Description</th>
                <th className="border-b border-r border-gray-400 py-1.5 px-2 text-right">Unit Price</th>
                <th className="border-b border-r border-gray-400 py-1.5 px-2 text-center w-16">Qty</th>
                <th className="border-b border-gray-400 py-1.5 px-2 text-right w-28">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.name}-${i}`} className="text-gray-800 align-top">
                  <td className="border-b border-r border-gray-300 py-1.5 px-2 text-gray-600 font-medium">{i + 1}</td>
                  <td className="border-b border-r border-gray-300 py-1.5 px-2">
                    <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {[item.variant?.size, item.variant?.color, item.variant?.sku ? `SKU: ${item.variant.sku}` : null].filter(Boolean).join(" | ")}
                    </p>
                  </td>
                  <td className="border-b border-r border-gray-300 py-1.5 px-2 text-right tabular-nums">{formatPrice(item.price)}</td>
                  <td className="border-b border-r border-gray-300 py-1.5 px-2 text-center">{item.quantity}</td>
                  <td className="border-b border-gray-300 py-1.5 px-2 text-right font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Signature */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="flex-1 pt-1 text-[10px] text-gray-600 order-2 sm:order-1">
            <h4 className="font-bold text-gray-800 uppercase tracking-widest text-[9px] mb-1">Declaration:</h4>
             <p className="leading-tight">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            {/* <p className="mt-1 text-[9px] uppercase font-semibold">
              SUBJECT TO UTTAR PRADESH JURISDICTION
            </p> */}
          </div>

          <div className="w-full sm:w-[260px] border border-gray-400 rounded-sm order-1 sm:order-2 shrink-0">
            <div className="flex justify-between py-1.5 px-2 text-xs border-b border-gray-200">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="tabular-nums font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            {(order.discount || 0) > 0 && (
              <div className="flex justify-between py-1.5 px-2 text-xs border-b border-gray-200 text-green-700">
                <span className="font-medium">Discount applied</span>
                <span className="tabular-nums font-medium">- {formatPrice(order.discount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 px-2 text-xs border-b border-gray-200">
              <span className="text-gray-600 font-medium">Shipping Charge</span>
              <span className="tabular-nums font-medium">{order.shippingCharge === 0 ? "Free" : formatPrice(order.shippingCharge || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2 text-xs border-b border-gray-400">
              <span className="text-gray-600 font-medium">Tax</span>
              <span className="tabular-nums font-medium">{formatPrice(order.tax || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-2 bg-gray-50 text-sm font-bold text-gray-900 border-b border-gray-400">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatPrice(order.total)}</span>
            </div>
            
            {/* Signature Block */}
            <div className="p-2 flex flex-col items-center justify-end min-h-[70px] bg-white rounded-b-sm">
              <div className="w-full border-b border-gray-300 mb-1 pb-1 flex flex-col items-center justify-center text-center">
                <span className="font-serif text-[10px] text-gray-800 font-bold uppercase tracking-wider mb-1">For The House of Rani</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Stamp" className="h-6 w-auto opacity-70 grayscale mb-0.5" />
              </div>
              <p className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-gray-300 text-[8px] text-gray-500 text-center leading-tight">
          <p className="font-semibold text-gray-700 mb-0.5">Return Policy:</p>
          <p>Please inspect goods immediately upon delivery. Returns are subject to our verified policy terms within 7 days of receipt.</p>
          <p className="mt-0.5 uppercase tracking-wider font-semibold text-gray-400">This is a computer generated invoice and does not require a physical signature.</p>
        </div>

      </div>
    </div>
    </>
  );
}
