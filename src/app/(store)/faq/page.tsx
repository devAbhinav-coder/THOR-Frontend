import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about orders, shipping, returns, customization, and gifting at The House of Rani.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ | The House of Rani",
    description:
      "Answers about orders, shipping, returns, customization, and gifting.",
    url: "/faq",
  },
};

const faqItems = [
  {
    q: "How do I choose the right saree online?",
    a: "Use filters on the shop page for fabric, price, and rating. Check product details, images, and reviews before placing your order.",
  },
  {
    q: "Do you offer bridal and occasion collections?",
    a: "Yes. We curate premium sarees and occasion styles, including bridal-ready options for weddings and festive events.",
  },
  {
    q: "Can I place a custom gifting request?",
    a: "Yes. Visit the gifting section to submit customization details. For customizable products, quote/request flow is used before finalization.",
  },
  {
    q: "What are your shipping timelines?",
    a: "Most orders are processed in 1-3 business days and delivered in about 3-10 business days, depending on location.",
  },
  {
    q: "Do you provide free shipping?",
    a: "Free shipping eligibility is shown on the site and checkout based on current policy and order value.",
  },
  {
    q: "How can I track my order?",
    a: "Once shipped, tracking details are shared and you can also check order status from your account dashboard.",
  },
  {
    q: "What if my item is damaged or incorrect?",
    a: "Contact support with order details and clear photos. We will review and assist with replacement or resolution as per policy.",
  },
  {
    q: "Can I cancel or return an order?",
    a: "Eligibility depends on product type and order stage. Please review terms and shipping policy for full details.",
  },
  {
    q: "Are shipping and COD fees refunded if I return an item?",
    a: "No. Shipping charges (when applicable) and any COD handling fee are not refunded on approved returns. Refunds apply to the product-value portion of your order as explained at checkout and in our Terms.",
  },
];

export default function FaqPage() {
  const appUrl = getSiteUrl();
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${appUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: `${appUrl}/faq`,
      },
    ],
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LegalPageLayout
        title='Frequently Asked Questions'
        description='Quick answers about shopping, gifting, shipping, and support at The House of Rani.'
        lastUpdated='31 March 2026'
      >
        <h2>Common questions</h2>
        {faqItems.map((item) => (
          <div
            key={item.q}
            className='rounded-2xl border border-gray-100 bg-white/80 px-4 py-3.5 mb-3'
          >
            <h3 className='text-gray-900 font-extrabold tracking-tight'>
              {item.q}
            </h3>
            <p className='text-gray-700 mt-1.5'>{item.a}</p>
          </div>
        ))}

        <h2>Need more help?</h2>
        <p>
          Explore policy pages for detailed information:{" "}
          <Link href='/shipping' className='text-brand-600 hover:underline'>
            Shipping Policy
          </Link>
          {" · "}
          <Link href='/terms' className='text-brand-600 hover:underline'>
            Terms of Service
          </Link>
          {" · "}
          <Link href='/privacy' className='text-brand-600 hover:underline'>
            Privacy Policy
          </Link>
          {" · "}
          <Link href='/returns' className='text-brand-600 hover:underline'>
            Returns
          </Link>
          {" · "}
          <Link href='/gifting' className='text-brand-600 hover:underline'>
            Gifting
          </Link>
        </p>
      </LegalPageLayout>
    </>
  );
}
