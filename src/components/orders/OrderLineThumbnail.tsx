'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Package, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isUsableOrderLineImage,
  OFFLINE_MANUAL_LINE_PLACEHOLDER_PATH,
} from '@/lib/offlineOrder';

type OrderLineThumbnailProps = {
  image?: string | null;
  name?: string;
  isOfflineManual?: boolean;
  className?: string;
  sizes?: string;
  onClick?: () => void;
};

function normalizeThumbnailSrc(image: string): string {
  const url = image.trim();
  if (url.startsWith('/')) return url;
  return url;
}

export default function OrderLineThumbnail({
  image,
  name,
  isOfflineManual,
  className,
  sizes = '56px',
  onClick,
}: OrderLineThumbnailProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [image]);

  const usable = isUsableOrderLineImage(image, { isOfflineManual });
  const showImage = usable && !loadFailed;
  const Icon = isOfflineManual ? PenLine : Package;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0',
        onClick && showImage && 'cursor-pointer',
        className,
      )}
      onClick={showImage ? onClick : undefined}
      role={showImage && onClick ? 'button' : undefined}
    >
      {showImage ?
        <Image
          src={normalizeThumbnailSrc(image!)}
          alt={name || 'Product'}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setLoadFailed(true)}
        />
      : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400">
          <Icon className="h-5 w-5" aria-hidden />
          <span className="sr-only">{name || 'Line item'}</span>
        </div>
      }
    </div>
  );
}

/** Local fashion placeholder — always loads (same-origin SVG). */
export function OfflineLinePlaceholderThumbnail({
  className,
  sizes = '44px',
}: {
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[#fdf8f3] border border-gray-200 flex-shrink-0',
        className,
      )}
    >
      <Image
        src={OFFLINE_MANUAL_LINE_PLACEHOLDER_PATH}
        alt="Fashion line"
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
