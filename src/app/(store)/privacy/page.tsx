import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The House of Rani collects, uses, and protects your personal information when you shop with us.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | The House of Rani",
    description:
      "How we collect, use, store, and protect your personal data when you shop with us.",
    url: "/privacy",
  },
};

const SUPPORT_EMAIL = "support@thehouseofrani.com";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy explains how we handle your personal data when you use our website, place orders, or contact The House of Rani. We treat your information with care and in line with applicable Indian law."
      lastUpdated="22 April 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        <strong>The House of Rani</strong> (“we”, “us”, “our”) runs this online
        store and related customer services. For privacy questions or requests,
        use the contact details in{" "}
        <Link href="#contact">Section 10 (Contact)</Link> below.
      </p>

      <h2>2. Scope</h2>
      <p>
        This Privacy Policy applies to information collected through our
        website, checkout, account area, customer support, and marketing you
        receive from us. Third-party sites we link to have their own policies;
        those apply once you leave our site.
      </p>

      <h2>3. Information we collect</h2>
      <p>
        Depending on how you use our services, we may collect the following:
      </p>
      <ul>
        <li>
          <strong>Account and identity:</strong> name, email, phone number, and
          account credentials (passwords are stored using secure hashing; we do
          not keep plain-text passwords).
        </li>
        <li>
          <strong>Orders and delivery:</strong> shipping and billing addresses,
          order contents, and payment method type. Card or UPI details are
          handled by our payment partners where applicable.
        </li>
        <li>
          <strong>Communications:</strong> messages you send to support,
          feedback, and marketing preferences.
        </li>
        <li>
          <strong>Technical and usage:</strong> IP address, device and browser
          type, approximate location, pages viewed, referring URLs, and cookies
          or similar technologies (see Section 5).
        </li>
      </ul>

      <h2>4. How we use your information</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>Process, fulfil, and deliver your orders</li>
        <li>Run accounts, authentication, and security</li>
        <li>Handle support, returns, and disputes</li>
        <li>Take payments, prevent fraud, and meet legal obligations</li>
        <li>Improve our site, products, and experience</li>
        <li>
          Send transactional messages (confirmations, shipping updates) and,
          where permitted, marketing (you can opt out of promotional email where
          the law allows)
        </li>
      </ul>
      <p>
        We rely on lawful bases such as contract, legitimate interests, consent
        where required, and legal obligation.
      </p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We use cookies and related technologies to run the site (cart, session,
        security), remember preferences, and understand traffic and performance.
        You can control cookies in your browser; turning off essential cookies
        may affect checkout or login.
      </p>

      <h2>6. Sharing and disclosure</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> for hosting, analytics, email,
          payments, shipping, and support—only as needed and under appropriate
          safeguards.
        </li>
        <li>
          <strong>Legal and safety:</strong> when required by law or to protect
          rights, safety, and security.
        </li>
        <li>
          <strong>Business transfers:</strong> in a merger, acquisition, or
          sale of assets, subject to continued protection of your information.
        </li>
      </ul>
      <p>
        We do not sell your personal information in the sense of selling
        marketing lists to unknown third parties.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We keep data only as long as needed for the purposes above, including
        legal, tax, and accounting rules. Order records may be kept for periods
        required under Indian law.
      </p>

      <h2>8. Security</h2>
      <p>
        We use appropriate technical and organisational measures to protect
        personal data. No online transmission is completely risk-free; please use
        strong passwords and keep your devices secure.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Under applicable law (including the Digital Personal Data Protection
        Act, 2023, where it applies to you), you may have rights to access,
        correct, erase, restrict, or object to processing, and to withdraw consent
        where processing is consent-based. To exercise these rights, contact us
        using{" "}
        <Link href="#contact">Section 10</Link>. You may also complain to the
        Data Protection Board of India or another competent authority where the
        law allows.
      </p>

      <h2 id="contact">10. Contact</h2>
      <p>
        For privacy-related questions or requests (including access, correction,
        or deletion), email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Please include
        your name, the email associated with your account, and a clear
        description of your request. If your message concerns an order, add
        your <strong>order number</strong> so we can help faster.
      </p>

      <h2>11. Children</h2>
      <p>
        Our services are not aimed at children under 18. We do not knowingly
        collect personal information from children. If you believe we have,{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>contact us</a> and we will take steps
        to delete it.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The “Last updated”
        date at the top will change when we do. For important changes, we may
        also email you or show a notice on the site where appropriate.
      </p>
    </LegalPageLayout>
  );
}
