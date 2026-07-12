import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";

/** AI crawler discovery file (emerging convention alongside llms.txt). */
export const revalidate = 86400;

export async function GET() {
  const siteUrl = getSiteUrl();

  return NextResponse.redirect(`${siteUrl}/llms.txt`, 308);
}
