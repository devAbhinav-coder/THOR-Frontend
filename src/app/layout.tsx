import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
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
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg" }],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://www.thehouseofrani.com",
  ),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://www.thehouseofrani.com"
  ).replace(/\/+$/, "");
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The House of Rani",
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
      data-csp-nonce={nonce}
    >
      <head>
        {/* Inline in head (not next/script) avoids client/server nonce hydration mismatch */}
        <script
          id='consent-mode-default'
          nonce={nonce || undefined}
          dangerouslySetInnerHTML={{ __html: consentModeDefaultScript }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type='application/ld+json'
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
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              className:
                "text-sm font-semibold !rounded-2xl !shadow-xl !px-5 !py-4 !border !border-gray-100",
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
                style: {
                  background: "#f0fdf4",
                  color: "#065f46",
                  borderColor: "#bbf7d0",
                },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  borderColor: "#fecaca",
                },
              },
              style: {
                background: "#fff",
                color: "#1f2937",
              },
            }}
          />
          <GoogleAnalytics />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
