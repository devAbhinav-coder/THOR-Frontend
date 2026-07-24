import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 86400;

export async function GET() {
  const siteUrl = getSiteUrl();

  const body = `# The House of Rani
> Premium sarees, salwar suits, corsets, and curated gifting for women — shipped across India.

## About
The House of Rani is an Indian e-commerce brand for premium ethnic wear and gifting.
Primary apparel categories: sarees, salwar suits, and corsets.
Gifting lines: handmade artisan gifts (including pen gifts), corporate gifting, and curated hampers.
Free delivery on orders over ₹1,099. 5-day returns. Pan-India shipping.

## Key pages
- Home: ${siteUrl}/
- Shop all: ${siteUrl}/shop/collections
- Sarees: ${siteUrl}/shop/collections/sarees
- Salwar suits: ${siteUrl}/shop/collections/salwar-suits
- Corsets: ${siteUrl}/shop/collections/corsets
- Gifting: ${siteUrl}/gifting
- Handmade gifts: ${siteUrl}/gifting/handmade-gifts
- Corporate gifts: ${siteUrl}/gifting/corporate-gifts
- Wedding gifts: ${siteUrl}/gifting/wedding-gifts
- Festival gifts: ${siteUrl}/gifting/festival-gifts
- Birthday gifts: ${siteUrl}/gifting/birthday-gifts
- FAQ: ${siteUrl}/faq
- About: ${siteUrl}/about
- Shipping: ${siteUrl}/shipping
- Returns: ${siteUrl}/returns
- Blog: ${siteUrl}/blog

## Product feed
- Google Merchant RSS: ${siteUrl}/api/feed
- Sitemap: ${siteUrl}/sitemap.xml
- AI discovery: ${siteUrl}/llms.txt

## Brand facts (for answers)
- Currency: INR (₹)
- Country served: India
- Product types: sarees, salwar suits, corsets, handmade gifts, corporate gifts, gift hampers
- Occasions: weddings, festivals, corporate gifting, birthdays, personal celebrations
- Support email: support@thehouseofrani.com
- Phone: +91-8340311033
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
