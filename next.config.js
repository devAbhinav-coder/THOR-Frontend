const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Parent-root tracing fixes local monorepo + dual lockfile warning; on Vercel it breaks paths (e.g. routes-manifest ENOENT).
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(__dirname, '../') }),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Product/media URLs are served from Cloudinary (already resized/optimized).
    // Vercel's `/_next/image` optimizer can return 402 Payment Required when Image Optimization
    // billing/quota disagrees with the dashboard — bypass avoids double-optimization and that error.
    // We instead route Cloudinary URLs through `src/lib/cloudinaryLoader.ts` per-image
    // (used in `<Image loader={cloudinaryLoader} />`) so the browser still receives
    // AVIF/WebP at the rendered width without consuming Vercel image quota.
    unoptimized: true,
    // Explicit qualities required for Next.js 16+; must cover every `quality` prop + default (75).
    qualities: [50, 58, 60, 65, 68, 72, 75, 80, 85, 88, 90, 92],
    remotePatterns: [
      /** Explicit path so Next 15+ image matcher always allows Cloudinary delivery URLs. */
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  /**
   * Security & best-practice headers — these directly raise Lighthouse
   * "Best Practices" by satisfying the HSTS, COOP, and Permissions-Policy
   * audits, and they prevent clickjacking + MIME-sniffing.
   *
   * `Strict-Transport-Security` is only effective on HTTPS, so we don't
   * apply it locally (Next dev serves http://localhost which would just
   * show a console warning).
   */
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
      },
      // COOP — Lighthouse "Ensure proper origin isolation with COOP".
      // `same-origin-allow-popups` keeps Razorpay / Google OAuth popups working.
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      // CORP — pair with COOP so subresources opt into cross-origin reads safely.
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      // X-DNS-Prefetch-Control + X-Permitted-Cross-Domain-Policies are cheap
      // wins that satisfy several Best-Practices sub-audits in CI scanners.
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        // 2 years + subdomains + preload list — the strongest HSTS Lighthouse audits expect.
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Long-cache hashed Next chunks → "Use efficient cache lifetimes" passes.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public static assets (logo, OG, fonts) — long cache via filename hash where possible.
        source: '/:path((?:.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff|woff2|ttf)))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
});
