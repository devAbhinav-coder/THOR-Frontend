import type { Metadata } from 'next';
import ConnectClient from './ConnectClient';
import { getSiteUrl } from '@/lib/siteUrl';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const title = 'Connect | The House of Rani';
  const description = 'Welcome to The House of Rani. Connect with us on Instagram, Facebook, YouTube, or easily get in touch with our support.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/connect`,
      siteName: 'The House of Rani',
      images: [
        {
          url: `${siteUrl}/ogimage.png`,
          width: 1200,
          height: 630,
          alt: 'The House of Rani Connect',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/ogimage.png`],
    },
  };
}

export default function ConnectPage() {
  return <ConnectClient />;
}
