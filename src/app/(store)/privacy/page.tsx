import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How The House of Rani collects, uses, and protects your personal information when you shop with us.',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy explains how we handle your personal data when you use our website, place orders, or interact with The House of Rani. We are committed to protecting your privacy in line with applicable Indian law."
      lastUpdated="27 March 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        <strong>The House of Rani</strong> (“we”, “us”, “our”) operates this online store and related
        services. For questions about this policy or your data, use the contact details in Section 10.
      </p>

      <h2>2. Scope</h2>
      <p>
        This Privacy Policy applies to information collected through our website, mobile experience (if
        applicable), checkout, account area, customer support channels, and marketing communications you
        receive from us. It does not govern third-party sites linked from our store; their policies apply
        when you leave our site.
      </p>

      <h2>3. Information we collect</h2>
      <p>We may collect the following categories of information, depending on how you use our services:</p>
      <ul>
        <li>
          <strong>Account & identity:</strong> name, email address, phone number, password (stored
          securely; we do not store plain-text passwords where hashing is used).
        </li>
        <li>
          <strong>Order & delivery:</strong> shipping and billing addresses, order contents, payment
          method type (we rely on payment partners for card/UPI details where applicable).
        </li>
        <li>
          <strong>Communications:</strong> messages you send to support, survey responses, and marketing
          preferences.
        </li>
        <li>
          <strong>Technical & usage:</strong> IP address, device/browser type, approximate location,
          pages viewed, referring URLs, and cookies or similar technologies (see Section 5).
        </li>
      </ul>

      <h2>4. How we use your information</h2>
      <p>We use personal data for purposes including:</p>
      <ul>
        <li>Processing, fulfilling, and delivering your orders</li>
        <li>Account creation, authentication, and security</li>
        <li>Customer support, returns, and dispute resolution</li>
        <li>Payment processing, fraud prevention, and legal compliance</li>
        <li>Improving our website, products, and user experience</li>
        <li>
          Sending transactional messages (order confirmations, shipping updates) and, where permitted,
          marketing (you may opt out of promotional email where the law allows)
        </li>
      </ul>
      <p>We process data on lawful bases such as performance of a contract, legitimate interests, consent where required, and legal obligation.</p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We use cookies and related technologies to operate the site (e.g. cart, session, security),
        remember preferences, and understand traffic and performance. You can control cookies through your
        browser settings; disabling essential cookies may affect checkout or login.
      </p>

      <h2>6. Sharing and disclosure</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who assist with hosting, analytics, email, payments, shipping,
          and customer support—only as needed for their services and under appropriate safeguards.
        </li>
        <li>
          <strong>Legal and safety:</strong> when required by law, court order, or to protect rights,
          safety, and security of users, us, or others.
        </li>
        <li>
          <strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets,
          subject to continued protection of your information.
        </li>
      </ul>
      <p>We do not sell your personal information in the conventional sense of selling lists to unknown third parties for their independent marketing.</p>

      <h2>7. Data retention</h2>
      <p>
        We retain data only as long as necessary for the purposes above, including legal, tax, and
        accounting requirements. Order and invoice records may be kept for periods required under Indian
        law. Marketing preferences and inactive accounts may be updated or deleted according to our
        internal policies.
      </p>

      <h2>8. Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect personal data against
        unauthorized access, alteration, disclosure, or destruction. No method of transmission over the
        Internet is 100% secure; we encourage strong passwords and caution when sharing device access.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Depending on applicable law (including the Digital Personal Data Protection Act, 2023, where
        relevant), you may have rights to access, correction, erasure, restriction, objection, or
        portability of your personal data, and to withdraw consent where processing is consent-based. To
        exercise these rights, contact us using the details below. You may also lodge a complaint with the
        Data Protection Board of India or other competent authority as the law permits.
      </p>

      <h2>10. Children</h2>
      <p>
        Our services are not directed at children under 18. We do not knowingly collect personal
        information from children. If you believe we have collected such data, please contact us so we can
        delete it.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The “Last updated” date at the top will
        change when we do. Material changes may be communicated by email or a notice on the site where
        appropriate.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy-related requests or questions, contact us through the details provided on our website
        (e.g. Contact or Support page) or the email address listed in your order communications. Please
        include your name, email, and a clear description of your request.
      </p>
    </LegalPageLayout>
  );
}
