import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import Script from "next/script";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/AppToaster";
import { AuthProvider } from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MetaPixel from "@/components/analytics/MetaPixel";
import { getSiteUrl } from "@/lib/siteUrl";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: true,
});

const SITE_URL = getSiteUrl();

/**
 * Lighthouse warns when more than 4 `preconnect` hints exist — extra
 * connections waste sockets and bandwidth. Keep the highest-impact origins
 * (API + Cloudinary, since both are used during the LCP), preconnect the
 * font CDN since `next/font` already requests from `fonts.gstatic.com`,
 * and downgrade the analytics origin to a cheaper `dns-prefetch` (it isn't
 * needed for the critical render).
 */
function preconnectHints(): { href: string; crossOrigin?: "" }[] {
  const hints: { href: string; crossOrigin?: "" }[] = [
    // Cloudinary CDN — all product / hero / category images live here.
    { href: "https://res.cloudinary.com", crossOrigin: "" },
    // Google Fonts binary CDN — DM Sans + Playfair Display.
    { href: "https://fonts.gstatic.com", crossOrigin: "" },
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

/**
 * Cheaper hint than preconnect — tells the browser to resolve DNS but not
 * open a socket. Used for origins that load *after* hydration (analytics).
 */
const DNS_PREFETCH_HINTS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://www.clarity.ms",
  "https://us.i.posthog.com",
  "https://connect.facebook.net",
];

export const metadata: Metadata = {
  title: {
    default: "The House of Rani | Premium Indian Ethnic Wear & Gifting",
    template: "%s | The House of Rani",
  },
  description:
    "Discover premium sarees and handcrafted gifting at The House of Rani—where heritage craftsmanship meets modern elegance. Shop timeless styles delivered across India.",
keywords: [
  "sarees online India",
  "buy sarees online",
  "premium sarees",
  "designer sarees India",
  "festive sarees India",
  "handcrafted gifts India",
  "corporate gifting India",
  "gift hampers India",
  "The House of Rani"
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
  title: "Premium Sarees & Handcrafted Gifts | The House of Rani",
  description:
    "Discover premium sarees and handcrafted gifting—where heritage meets modern luxury.",
  images: [
    {
      url: `${SITE_URL}/ogimage.png`,
      width: 1200,
      height: 630,
      alt: "Premium Sarees & Handcrafted Gifts – The House of Rani",

    },
  ],
},
 twitter: {
  card: "summary_large_image",
  title: "Premium Sarees & Handcrafted Gifts | The House of Rani",
  description:
    "Explore premium sarees and handcrafted gifting designed for elegance and timeless style.",
  images: [`${SITE_URL}/ogimage.png`],
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
  /** Single @graph: Organization ↔ WebSite publisher — helps Google show a brand site name vs raw domain. */
  const siteGraphLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "The House of Rani",
        alternateName: ["House of Rani"],
        url: appUrl,
        logo: {
          "@type": "ImageObject",
          url: `${appUrl}/logoNew.png`,
          width: 512,
          height: 512,
        },
        description:"Premium sarees and handcrafted gifting designed for elegance, tradition, and modern luxury.",
        /**
         * sameAs links the brand to its official social and directory profiles.
         * Google uses these to build and verify the Knowledge Panel entry.
         */
        sameAs: [
          "https://www.instagram.com/houseofrani",
        "https://www.facebook.com/people/HouseofRani/61580570102572/",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["English", "Hindi"],
          areaServed: "IN",
          email:"support@thehouseofrani.com",
          telephone:"+91-8340311033"
        },
        areaServed: {
          "@type": "Country",
          name: "India",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        name: "The House of Rani",
        alternateName: ["House of Rani"],
        url: appUrl,
        inLanguage: "en-IN",
        publisher: { "@id": `${appUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${appUrl}/shop?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
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

  return (
    <html
      lang='en'
      className={`${dmSans.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        {preconnectHints().map((p) => (
          <link
            key={p.href}
            rel='preconnect'
            href={p.href}
            crossOrigin={p.crossOrigin}
          />
        ))}
        {DNS_PREFETCH_HINTS.map((href) => (
          <link key={href} rel='dns-prefetch' href={href} />
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraphLd) }}
        />
      </head>
      <body className='min-h-screen'>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src='https://www.googletagmanager.com/ns.html?id=GTM-WQ386HHK'
            height='0'
            width='0'
            style={{ display: "none", visibility: "hidden" }}
            title='Google Tag Manager'
          />
        </noscript>
        <AuthProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <QueryProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </QueryProvider>
          <AppToaster />
          <GoogleAnalytics />
          <MetaPixel />
          <CookieConsentBanner />
        </AuthProvider>

        {/*
         * 3rd-party analytics moved out of <head> and deferred so they don't
         * compete with the LCP image / hydration. `afterInteractive` runs
         * after page becomes interactive — Lighthouse no longer counts these
         * as render-blocking, which lifts the Performance score.
         */}
        <Script
          id='gtm-loader'
          strategy='afterInteractive'
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WQ386HHK');
            `,
          }}
        />
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script
            id='clarity-loader'
            strategy='lazyOnload'
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
              `,
            }}
          />
        )}
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <Script
            id='posthog-loader'
            strategy='lazyOnload'
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', {api_host:'https://us.i.posthog.com', person_profiles: 'identified_only'});
              `,
            }}
          />
        )}

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
