/**
 * Shared HTTP plumbing for server-side provider adapters (Resend, 2Factor.in, NewsData.io).
 * Errors carry a code and a safe message only: never the request URL (2Factor puts the API key in the path), never
 * headers, never the response body (which can echo inputs such as OTP codes).
 */
export type ProviderErrorCode = 'NOT_CONFIGURED' | 'INVALID_KEY' | 'RATE_LIMITED' | 'QUOTA' | 'REJECTED' | 'UNAVAILABLE' | 'TIMEOUT' | 'NETWORK' | 'MALFORMED';
export class ProviderError extends Error {
  constructor(public provider: string, public code: ProviderErrorCode, public status?: number) {
    super(`${provider}: ${code}${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'ProviderError';
  }
}
export type Fetch = typeof fetch;

/** fetch with a timeout; network failures and timeouts become ProviderError without leaking the URL. */
export async function request(provider: string, url: string, init: RequestInit & { timeoutMs?: number; fetchImpl?: Fetch } = {}): Promise<Response> {
  const { timeoutMs = 8000, fetchImpl = fetch, ...rest } = init;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...rest, signal: ctl.signal, cache: 'no-store' });
  } catch (e) {
    throw new ProviderError(provider, (e as Error)?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK');
  } finally {
    clearTimeout(t);
  }
}
/** Maps an HTTP status to a provider error code (null for success). */
export function statusCode(status: number): ProviderErrorCode | null {
  if (status >= 200 && status < 300) return null;
  if (status === 401 || status === 403) return 'INVALID_KEY';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'UNAVAILABLE';
  return 'REJECTED';
}
export async function json(provider: string, res: Response): Promise<unknown> {
  try { return await res.json(); } catch { throw new ProviderError(provider, 'MALFORMED', res.status); }
}
