/** Mirrors backend/src/middleware/upload.ts fileSize limits (in MB). */
export const UPLOAD_MAX_MB = {
  product: 12,
  gifting: 12,
  review: 12,
  storefront: 10,
  avatar: 2,
  cartCustomField: 3,
  blog: 5,
  category: 2,
} as const;

export function uploadMaxBytes(mb: number): number {
  return mb * 1024 * 1024;
}
