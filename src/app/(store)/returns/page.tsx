import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return & Cancellation Policy",
  description:
    "How to return items, request refunds, and cancel orders at The House of Rani — including COD, shipping charges, and order timelines.",
  alternates: {
    canonical: "/returns",
  },
  openGraph: {
    title: "Return & Cancellation Policy | The House of Rani",
    description:
      "Returns, refunds, and cancellations for orders placed with The House of Rani.",
    url: "/returns",
  },
};

export default function ReturnsPage() {
  return (
    <LegalPageLayout
      title='Return & Cancellation Policy'
      description='We want you to love every piece you order. This page sets out how returns, refunds, and cancellations work for purchases made on our website, so expectations are clear from the start.'
      lastUpdated='22 April 2026'
    >
      <h2>1. Overview</h2>
      <p>
        This policy applies to products bought through{" "}
        <strong>The House of Rani</strong> online store. It works alongside our{" "}
        <Link href='/terms'>Terms of Service</Link>,{" "}
        <Link href='/shipping'>Shipping Policy</Link>, and applicable law
        (including consumer protections in India where they apply to you).
      </p>

      <h2>2. Order cancellation (before dispatch)</h2>
      <p>
        You may request to <strong>cancel an order</strong> from your account
        while it is still being prepared and{" "}
        <strong>has not been handed to the courier for dispatch</strong>. Once
        the order status shows as shipped or dispatched, cancellation through
        the site may no longer be available; contact us at{" "}
        <a href='mailto:support@thehouseofrani.com'>
          support@thehouseofrani.com
        </a>{" "}
        with your order number and we will advise what is possible.
      </p>
      <p>
        Approved cancellations before dispatch are refunded as per the original
        payment method where technically possible, in line with the fee rules in
        Section 5.
      </p>

      <h2>3. How to start a return</h2>
      <p>
        To request a return, sign in and open <strong>My orders</strong>, select
        the relevant order, and use the return or support options shown there
        (or follow the instructions in your delivery or order email). If you
        cannot find the option, email{" "}
        <a href='mailto:support@thehouseofrani.com'>
          support@thehouseofrani.com
        </a>{" "}
        with your <strong>order number</strong>, the item(s) you wish to return,
        and a brief reason. We will confirm eligibility and the next steps
        (including return address or pickup, where offered).
      </p>
      <p>
        Items should be returned{" "}
        <strong>unused, unworn, with tags attached</strong>, and in original
        packaging where reasonable, unless the return is due to a defect or an
        error on our part. We reserve the right to refuse returns that do not
        meet these conditions or that fall outside the communicated return
        window.
      </p>

      <h2>4. Custom, altered, and final-sale items</h2>
      <p>
        Made-to-order, personalised, or heavily altered pieces may be{" "}
        <strong>non-returnable</strong> except where they are faulty or not as
        described. Any exception will be stated clearly at checkout or in your
        order confirmation.
      </p>

      <h2>5. Refunds — product value, COD, and shipping</h2>
      <p>
        When a return is approved and we receive the item back (and inspect it
        where needed), refunds are generally applied to the{" "}
        <strong>product value</strong> of the returned line items, using the
        same payment route as the original order where possible.
      </p>
      <ul>
        <li>
          <strong>Cash on delivery (COD):</strong> Any separate COD handling,
          convenience, or collection fee charged on the order is{" "}
          <strong>not refundable</strong> as part of a return or order
          cancellation, even when the product amount is refunded.
        </li>
        <li>
          <strong>Shipping charges:</strong> Standard outbound shipping fees
          (including cases where free shipping applied only above a certain cart
          value, e.g. orders under ₹1,099 where a shipping fee was charged) are{" "}
          <strong>not refunded</strong> on a change of mind or size/colour
          preference return, unless we sent the wrong item, the item is
          defective, or we have explicitly agreed otherwise in writing.
        </li>
      </ul>
      <p>
        If you paid only by COD, any refund of product value will be handled as
        agreed in writing (for example bank transfer or store credit), after we
        confirm receipt and condition of the goods.
      </p>

      <h2>6. Timelines</h2>
      <p>
        Return windows and processing times may vary by product category and
        promotion; the applicable window will be stated on the product page,
        checkout, or in your order email where we offer returns. Refunds, after
        approval, are typically initiated within a reasonable number of working
        days after we receive the return; your bank or wallet may take
        additional time to show the credit.
      </p>

      <h2>7. Faulty or incorrect items</h2>
      <p>
        If you receive a damaged, defective, or wrong item, contact us at{" "}
        <a href='mailto:support@thehouseofrani.com'>
          support@thehouseofrani.com
        </a>{" "}
        with photos and your order number within a reasonable time of delivery.
        We will work with you on replacement or refund as appropriate.
      </p>

      <h2>8. Questions</h2>
      <p>
        For anything not covered here, write to{" "}
        <a href='mailto:support@thehouseofrani.com'>
          support@thehouseofrani.com
        </a>
        . We aim to respond in a timely manner during business days.
      </p>
    </LegalPageLayout>
  );
}
