import { log } from './log';

/**
 * Error monitoring interface. `reportError` always writes a structured log line; a vendor reporter (Sentry or similar)
 * can be attached with `setErrorReporter` once its DSN is configured. None is configured, so nothing leaves the server.
 */
type Reporter = (err: unknown, context: Record<string, string>) => void;
let reporter: Reporter | null = null;
export const setErrorReporter = (r: Reporter | null) => { reporter = r; };
export function reportError(err: unknown, context: Record<string, string> = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  log('error', 'unhandled_error', { message: e.message.slice(0, 300), name: e.name, digest: (e as Error & { digest?: string }).digest, ...context });
  try { reporter?.(e, context); } catch { /* never throw from the reporter */ }
}
