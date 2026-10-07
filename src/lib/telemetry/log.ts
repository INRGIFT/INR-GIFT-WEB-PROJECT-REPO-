/**
 * Structured server logs: one JSON object per line on stdout/stderr, which GoDaddy, any Node host or a log drain can
 * collect. Never log secrets, tokens, emails, phone numbers or request bodies.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
export function log(level: Level, event: string, fields: Record<string, string | number | boolean | null | undefined> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error' || level === 'warn') console.error(line); else if (level !== 'debug' || process.env.LOG_DEBUG === '1') console.log(line);
}
