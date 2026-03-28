import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import SmoothScroll from '@/components/providers/SmoothScroll';
import { NavigationProgress } from '@/components/layout/NavigationProgress';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The House of Rani | Premium Indian Ethnic Wear',
    template: '%s | The House of Rani',
  },
  description:
    'Discover exquisite Indian ethnic wear — sarees, lehengas, salwar suits, and more. Handcrafted with love, delivered to your door.',
  keywords: ['sarees', 'lehengas', 'Indian ethnic wear', 'salwar suits', 'online shopping India', 'The House of Rani'],
  authors: [{ name: 'The House of Rani' }],
  creator: 'The House of Rani',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'The House of Rani',
    title: 'The House of Rani | Premium Indian Ethnic Wear',
    description: 'Discover exquisite Indian ethnic wear — sarees, lehengas, salwar suits, and more.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The House of Rani | Premium Indian Ethnic Wear',
    description: 'Discover exquisite Indian ethnic wear — sarees, lehengas, salwar suits, and more.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable}`}
      suppressHydrationWarning
      data-csp-nonce={nonce}
    >
      <body className="min-h-screen">
        <AuthProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <QueryProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#fff', color: '#333', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
              success: { iconTheme: { primary: '#be185d', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
