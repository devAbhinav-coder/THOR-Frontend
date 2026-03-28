import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms and conditions for using The House of Rani website, placing orders, and purchasing products.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These terms govern your use of our website and your purchase of products from The House of Rani. By accessing our site or placing an order, you agree to these terms."
      lastUpdated="27 March 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (“Terms”) form a binding agreement between you and The House of Rani
        (“we”, “us”, “our”). If you do not agree, please do not use our website or services.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and capable of entering into a legally binding contract under
        Indian law. If you use our services on behalf of a business, you represent that you have authority
        to bind that business.
      </p>

      <h2>3. Account</h2>
      <p>
        You may need an account for certain features. You are responsible for keeping your login
        credentials confidential and for all activity under your account. Notify us promptly of any
        unauthorized use. We may suspend or terminate accounts that violate these Terms or pose security
        risks.
      </p>

      <h2>4. Products, pricing, and availability</h2>
      <p>
        We strive to display accurate descriptions, images, and prices. Minor variations in colour,
        texture, or craftsmanship may occur with handcrafted or natural products. Prices and availability
        are subject to change without notice until your order is confirmed. We reserve the right to
        refuse or cancel orders (including after payment) in cases of pricing errors, suspected fraud,
        stock unavailability, or legal restrictions—typically with a refund of amounts paid for the
        cancelled portion.
      </p>

      <h2>5. Orders and payment</h2>
      <p>
        An order is an offer to purchase. We accept it when we send an order confirmation or ship the
        goods, as applicable. Payment methods shown at checkout are processed through our payment
        partners. You agree to provide current, complete, and accurate billing information. Title and risk
        of loss for physical goods pass to you upon delivery to the carrier or as stated at checkout,
        except where mandatory law provides otherwise.
      </p>

      <h2>6. Shipping and delivery</h2>
      <p>
        Delivery timelines are estimates and depend on location, courier, and product availability. See
        our{' '}
        <Link href="/shipping" className="text-brand-600 hover:underline font-medium">
          Shipping Policy
        </Link>{' '}
        for details. We are not liable for delays caused by carriers, customs, weather, strikes, or other
        events outside our reasonable control.
      </p>

      <h2>7. Returns, refunds, and cancellations</h2>
      <p>
        Our return and refund rules (including eligibility, time limits, and condition of goods) are as
        published on our website at the time of purchase or in your order communications. Custom or
        personalized items may be non-returnable unless defective or as required by law. Statutory rights
        under the Consumer Protection Act, 2019 and other applicable law remain unaffected where they
        apply.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        All content on this site (including text, graphics, logos, images, and software) is owned by us or
        our licensors and is protected by copyright, trademark, and other laws. You may not copy,
        scrape, modify, distribute, or create derivative works without our written permission, except for
        personal, non-commercial viewing or as allowed by law.
      </p>

      <h2>9. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the site for unlawful, fraudulent, or harmful purposes</li>
        <li>Attempt to gain unauthorized access to our systems, accounts, or data</li>
        <li>Interfere with the site’s operation or other users’ experience</li>
        <li>Use automated means to access the site in violation of our robots policy or applicable law</li>
        <li>Misrepresent your identity or affiliation</li>
      </ul>

      <h2>10. Disclaimers</h2>
      <p>
        To the fullest extent permitted by law, the site and products are provided “as is” without
        warranties of merchantability, fitness for a particular purpose, or non-infringement, except where
        mandatory law implies warranties that cannot be excluded.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, we are not liable for indirect, incidental,
        special, consequential, or punitive damages, or loss of profits, data, or goodwill, arising from
        your use of the site or products. Our aggregate liability for claims relating to any order is
        generally limited to the amount you paid for that order, except where law prohibits such a cap
        (e.g. death, personal injury caused by negligence, or fraud).
      </p>

      <h2>12. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless The House of Rani and its affiliates, officers, and
        employees from claims, damages, and expenses (including reasonable legal fees) arising from your
        breach of these Terms, misuse of the site, or violation of third-party rights, to the extent
        permitted by law.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of India. Courts at a jurisdiction we specify on our Contact
        page (or, if none, courts in India having jurisdiction) shall have exclusive jurisdiction over
        disputes, subject to any mandatory consumer protections that apply to you.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may modify these Terms at any time. The updated Terms will be posted with a new “Last updated”
        date. Continued use after changes constitutes acceptance, except where law requires additional
        steps.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions about these Terms, contact us through the channels listed on our website (Contact /
        Support). Please include your order number if your query relates to a purchase.
      </p>

      <p className="text-sm text-gray-500 mt-8 pt-6 border-t border-gray-100 !mb-0">
        For how we handle personal data, see our{' '}
        <Link href="/privacy" className="text-brand-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
