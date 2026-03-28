'use client';

import { SectionErrorBoundary } from '@/components/ErrorBoundary';

export function StoreErrorBoundary({ children }: { children: React.ReactNode }) {
  return <SectionErrorBoundary>{children}</SectionErrorBoundary>;
}
