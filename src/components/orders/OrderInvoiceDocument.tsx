import { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  order: Order;
};

export default function OrderInvoiceDocument({ order }: Props) {
  return (
    <div className="mx-auto w-full max-w-[820px] bg-white text-black print:max-w-none">
      <div className="border border-gray-300 p-6 sm:p-8 print:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tax Invoice</h1>
            <p className="text-xs text-gray-600 mt-1">Original for Recipient</p>
          </div>
          <div className="text-right text-xs text-gray-700">
            <p className="font-semibold">The House of Rani</p>
            <p>Amrapali Princely State Sector 76</p>
            <p>Noida, Uttar Pradesh 201301</p>
            <p>support@thehouseofrani.com</p>
            <p>+91 8340311033</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Bill To</p>
            <p className="font-semibold">{order.shippingAddress?.name || "Customer"}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
            </p>
            <p>{order.shippingAddress?.country || "India"}</p>
            <p className="mt-1">Phone: {order.shippingAddress?.phone || "—"}</p>
          </div>
          <div className="sm:text-right">
            <p>
              <span className="text-gray-500">Invoice Date:</span> {formatDate(order.invoice?.generatedAt || order.createdAt)}
            </p>
            <p>
              <span className="text-gray-500">Order Date:</span> {formatDate(order.createdAt)}
            </p>
            <p>
              <span className="text-gray-500">Order Number:</span> {order.orderNumber}
            </p>
            <p>
              <span className="text-gray-500">Payment:</span> {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}
            </p>
            <p>
              <span className="text-gray-500">Payment Status:</span> {order.paymentStatus}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-2 text-left">#</th>
                <th className="border border-gray-300 px-2 py-2 text-left">Item</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Qty</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Rate</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.name}-${i}`}>
                  <td className="border border-gray-300 px-2 py-2">{i + 1}</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {[item.variant?.size, item.variant?.color, item.variant?.sku].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{formatPrice(item.price)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto w-full max-w-[320px] text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Discount</span>
            <span>- {formatPrice(order.discount || 0)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Shipping</span>
            <span>{formatPrice(order.shippingCharge || 0)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Tax</span>
            <span>{formatPrice(order.tax || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-300 mt-2 font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-500 text-center">
          This is a computer generated invoice and does not require a signature.
        </p>
      </div>
    </div>
  );
}
