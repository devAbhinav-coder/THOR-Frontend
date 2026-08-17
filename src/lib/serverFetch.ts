/**
 * Server-side fetch with a hard timeout so SSR pages fail fast instead of
 * hanging for minutes when the API is slow or blocked by background jobs.
 */
const DEFAULT_SERVER_FETCH_TIMEOUT_MS = 12_000;

export async function serverFetch(
  input: string | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_SERVER_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const { timeoutMs: _omit, signal: userSignal, ...rest } = init ?? {};

  const onUserAbort = () => controller.abort();
  userSignal?.addEventListener("abort", onUserAbort, { once: true });

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    userSignal?.removeEventListener("abort", onUserAbort);
  }
}
