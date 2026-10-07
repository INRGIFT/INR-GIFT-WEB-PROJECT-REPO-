/**
 * Server-only company settings read at request time. SUPPORT_PHONE is shown only when it is configured and looks like
 * a phone number; otherwise no number is shown anywhere (never a placeholder or an invented number).
 */
export function supportPhone(): string | null {
  if (typeof window !== 'undefined') return null;
  const raw = (process.env.SUPPORT_PHONE ?? '').trim();
  return /^\+?[0-9][0-9 ()-]{5,22}[0-9]$/.test(raw) ? raw : null;
}
/** tel: link target for a displayed number (digits and a leading +). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
