import { getSiteUrl } from "@/lib/siteUrl";

/** Shared Offer block for Google Merchant / Product rich results (shop + premium PDP). */
export function buildMerchantProductOfferLd(input: {
  pageUrl: string;
  price: number;
  inStock: boolean;
}): Record<string, unknown> {
  const appUrl = getSiteUrl();
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    "@type": "Offer",
    url: input.pageUrl,
    priceCurrency: "INR",
    price: Number(input.price || 0).toFixed(2),
    priceValidUntil,
    availability:
      input.inStock ?
        "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: "The House of Rani",
      url: appUrl,
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 5,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: "INR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "IN",
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 3,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: 3,
          maxValue: 10,
          unitCode: "DAY",
        },
      },
    },
  };
}
