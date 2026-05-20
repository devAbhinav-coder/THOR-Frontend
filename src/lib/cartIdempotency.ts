/** Per-operation idempotency keys for cart API retries (matches checkout order pattern). */
const pendingKeys = new Map<string, string>();

export function createCartIdempotencyKey(action: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cart-${action}-${crypto.randomUUID()}`;
  }
  return `cart-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateCartIdempotencyKey(operationKey: string): string {
  const existing = pendingKeys.get(operationKey);
  if (existing) return existing;
  const key = createCartIdempotencyKey(operationKey);
  pendingKeys.set(operationKey, key);
  return key;
}

export function clearCartIdempotencyKey(operationKey: string): void {
  pendingKeys.delete(operationKey);
}
