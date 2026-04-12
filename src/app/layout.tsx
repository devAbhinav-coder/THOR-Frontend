import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/AppToaster";
import { AuthProvider } from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { getSiteUrl } from "@/lib/siteUrl";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const SITE_URL = getSiteUrl();

function preconnectHints(): { href: string; crossOrigin?: "" }[] {
  const hints: { href: string; crossOrigin?: "" }[] = [
    { href: "https://res.cloudinary.com", crossOrigin: "" },
  ];
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api) {
    try {
      hints.unshift({ href: new URL(api).origin, crossOrigin: "" });
    } catch {
      /* invalid URL in env */
    }
  }
  return hints;
}

export const metadata: Metadata = {
  title: {
    default: "The House of Rani | Premium Indian Ethnic Wear & Gifting",
    template: "%s | The House of Rani",
  },
  description:
    "At The House of Rani, finding your dream saree is effortless. Discover premium quality, exquisite designs, and great prices delivered to your doorstep, from bridal wear to thoughtful gifting.",
  keywords: [
    "sarees",
    "bridal sarees",
    "gifting sarees",
    "handmade Gifts",
    "handmade Love",
    "corporate Gifts",
    "corporate Gifting",
    "corporate Gifting Ideas",
    "corporate Gifting Solutions",
    "Gift Hampers",
    "Festive Gifts",
    "Festive Gifting",
    "Festive Gifting Ideas",
    "Festive Gifting Solutions",
    "Indian ethnic wear & gifting",
    "lehengas",
    "salwar suits",
    "online saree shopping India",
    "The House of Rani",
  ],
  authors: [{ name: "The House of Rani" }],
  creator: "The House of Rani",
  applicationName: "The House of Rani",
  category: "fashion",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "The House of Rani",
    title: "The House of Rani | Premium Indian Ethnic Wear & Gifting",
    description:
      "Premium sarees, bridal collections, and curated gifting styles for every special occasion.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The House of Rani | Premium Indian Ethnic Wear & Gifting",
    description:
      "Shop premium sarees, bridal looks, and thoughtful gifting collections at The House of Rani.",
  },
  verification: {
    google: "c-mAKK6c-M5IbneZfLyOePUcU6LaG0a8H2QVX3vQz2M",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const appUrl = SITE_URL;
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The House of Rani",
    alternateName: ["House of Rani", "TheHouseOfRani"],
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    description:
      "Premium sarees, bridal collections, and thoughtful gifting for every special occasion.",
  };
  const consentModeDefaultScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
`;

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The House of Rani",
    alternateName: ["House of Rani", "TheHouseOfRani"],
    url: appUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${appUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang='en'
      className={`${dmSans.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        {preconnectHints().map((p) => (
          <link key={p.href} rel='preconnect' href={p.href} crossOrigin={p.crossOrigin} />
        ))}
        {/* Per-request CSP nonces can differ between SSR snapshot and client hydration in dev; suppressHydrationWarning is the supported escape hatch. */}
        <script
          id='consent-mode-default'
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: consentModeDefaultScript }}
        />
        <script
          type='application/ld+json'
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type='application/ld+json'
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className='min-h-screen'>
        <AuthProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <QueryProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </QueryProvider>
          <AppToaster />
          <GoogleAnalytics />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
