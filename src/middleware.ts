import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildContentSecurityPolicy, randomNonce } from "@/lib/csp";

/** Block proxy/tunnel verbs at the edge (no legitimate use for this storefront). */
const DISALLOWED_METHODS = new Set(["TRACE", "TRACK"]);

export function middleware(request: NextRequest) {
  if (DISALLOWED_METHODS.has(request.method)) {
    return new NextResponse(null, { status: 405 });
  }

  const nonce = randomNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce),
  );
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
