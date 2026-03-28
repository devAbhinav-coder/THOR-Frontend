'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  count?: number;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  count,
  className,
}: StarRatingProps) {
  const sizeClasses = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };
  const starSize = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }, (_, i) => {
          const filled = i < Math.floor(rating);
          const halfFilled = !filled && i < rating;

          return (
            <button
              key={i}
              type={interactive ? 'button' : undefined}
              onClick={() => interactive && onRatingChange?.(i + 1)}
              className={cn(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
            >
              {halfFilled ? (
                <span className="relative">
                  <Star className={cn(starSize, 'text-gray-300 fill-gray-300')} />
                  <span className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className={cn(starSize, 'text-gold-400 fill-gold-400')} />
                  </span>
                </span>
              ) : (
                <Star
                  className={cn(
                    starSize,
                    filled ? 'text-gold-400 fill-gold-400' : 'text-gray-300 fill-gray-300',
                    interactive && !filled && 'hover:text-gold-300 hover:fill-gold-300'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-sm text-gray-500">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
