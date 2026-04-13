import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'Shipping zones, processing times, delivery estimates, tracking, and what to do if your order is delayed or damaged — The House of Rani.',
  alternates: {
    canonical: '/shipping',
  },
  openGraph: {
    title: 'Shipping Policy | The House of Rani',
    description:
      'How we ship across India, processing times, tracking, and delivery estimates.',
    url: '/shipping',
  },
};

export default function ShippingPage() {
  return (
    <LegalPageLayout
      title="Shipping Policy"
      description="This policy describes how we process, ship, and deliver orders within India. Timelines are estimates; actual delivery depends on your location and courier performance."
      lastUpdated="27 March 2026"
    >
      <h2>1. Where we ship</h2>
      <p>
        We currently ship to addresses within <strong>India</strong> unless otherwise stated at checkout.
        We do not ship to P.O. boxes where our courier partners require a physical address for delivery.
      </p>

      <h2>2. Order processing</h2>
      <p>
        Orders are typically processed within <strong>1–3 business days</strong> after payment
        confirmation. During peak seasons (festivals, sales), processing may take longer; we will
        communicate significant delays when possible. “Business days” exclude Sundays and public holidays
        observed at our dispatch location.
      </p>

      <h2>3. Shipping methods and partners</h2>
      <p>
        We partner with reputable courier and logistics providers. Available shipping options (standard,
        express, etc.) and any applicable fees are shown at checkout before you pay. Delivery is made to
        the address you provide; please ensure it is complete and reachable by courier.
      </p>

      <h2>4. Estimated delivery time</h2>
      <p>
        After dispatch, estimated transit time is generally <strong>3–10 business days</strong> for most
        pin codes in India, depending on distance and service level. Remote or difficult-to-reach areas may
        take longer. These are estimates only—not guaranteed delivery dates unless we explicitly offer a
        guaranteed service and state the terms.
      </p>

      <h2>5. Order tracking</h2>
      <p>
        When your order ships, we send a confirmation with tracking information where the carrier
        supports it. You can also check status in your account (if available). Tracking may take 24–48 hours
        to update after handover to the courier.
      </p>

      <h2>6. Cash on delivery (COD)</h2>
      <p>
        If COD is offered for your order, payment is collected at delivery. Please keep the exact or
        agreed amount ready. Repeated COD refusals may lead to restrictions on future COD eligibility. COD
        availability may vary by product value, location, or our risk policies.
      </p>

      <h2>7. Failed or delayed delivery</h2>
      <p>
        If you are unavailable, the courier may attempt redelivery or ask you to collect from a hub.
        Uncollected shipments may be returned to us; additional shipping fees may apply for reshipment.
        We are not responsible for delays due to incorrect addresses, recipient unavailability, customs or
        regulatory holds (where applicable), or force majeure events.
      </p>

      <h2>8. Damaged or incorrect items</h2>
      <p>
        Inspect your package on delivery when possible. If the outer packaging is severely damaged, note it
        with the delivery person if their process allows. For missing items, wrong products, or
        manufacturing defects, contact us within the timeframe stated on our Returns / Support page with
        your order number and photos where helpful. We will work with you on replacement, refund, or store
        credit as per our policy and applicable law.
      </p>

      <h2>9. Lost shipments</h2>
      <p>
        If tracking shows no movement for an extended period or indicates loss, contact us. We will
        investigate with the carrier. If the shipment is confirmed lost, we will offer a refund or
        reshipment according to our policy and stock availability.
      </p>

      <h2>10. Shipping charges</h2>
      <p>
        Shipping fees (if any) are displayed at checkout. Free shipping promotions apply only when
        explicitly stated and may exclude certain products or regions. Taxes and duties within India are
        handled as shown on your invoice unless law requires otherwise.
      </p>
      <p>
        <strong>Returns:</strong> Shipping and any separate COD (cash on delivery) handling fee are{' '}
        <strong>not refundable</strong> when a return is approved — refunds cover the eligible product
        value only, consistent with our Terms of Service.
      </p>

      <h2>11. Split shipments</h2>
      <p>
        Large or multi-item orders may ship in more than one package. You may receive separate tracking
        updates. You are not charged extra for split shipments beyond what was shown at checkout.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Shipping Policy from time to time. The “Last updated” date reflects the latest
        revision. Continued ordering after updates means you accept the revised policy for new orders.
      </p>

      <h2>13. Contact</h2>
      <p>
        For shipping questions, address changes before dispatch, or delivery issues, reach us through the
        contact options on our website. Include your order number for faster resolution.
      </p>

      <p className="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-100 !mb-0">
        Related:{' '}
        <Link href="/terms" className="text-brand-600 hover:underline">
          Terms of Service
        </Link>
        {' · '}
        <Link href="/privacy" className="text-brand-600 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </LegalPageLayout>
  );
}
