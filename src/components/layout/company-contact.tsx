import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { COMPANY } from '@/lib/company';
import { supportPhone, telHref } from '@/lib/company-server';
import { cn } from '@/lib/format';

/** The X (formerly Twitter) mark, drawn with currentColor (lucide has no X logo). */
const XMark = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className} fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);
/** INRGIFT's two official social profiles (COMPANY.social, exact owner-supplied URLs), opened in a new tab. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1.5', className)} aria-label="INRGIFT on social media">
      {COMPANY.social.map((s) => (
        <li key={s.network}><a href={s.href} target="_blank" rel="noopener noreferrer me" className="link inline-flex items-center gap-1.5">{s.network === 'Instagram' ? <Instagram size={15} aria-hidden className="shrink-0 text-brand" /> : <XMark size={13} className="shrink-0 text-brand" />}{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
      ))}
    </ul>
  );
}
/**
 * INRGIFT's published contact details: support email, the phone number only when SUPPORT_PHONE is configured, and the
 * company address. Server component (reads SUPPORT_PHONE at request time).
 * The two official social profiles follow unless `social` is false (legal documents).
 */
export function CompanyContact({ className, title = 'Contact', compact = false, social = true }: { className?: string; title?: string | null; compact?: boolean; social?: boolean }) {
  const phone = supportPhone();
  return (
    <div className={cn('text-[14px] text-slate2', className)}>
      {title && <p className={cn('font-display font-bold text-navy', compact ? 'mb-2 text-[13px]' : 'mb-3 text-base')}>{title}</p>}
      <ul className={cn(compact ? 'space-y-1.5 text-[13px]' : 'space-y-2.5')}>
        <li className="flex gap-2"><Mail size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><span><span className="sr-only">Email: </span><a className="link" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></span></li>
        {phone && <li className="flex gap-2"><Phone size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><span><span className="sr-only">Phone: </span><a className="link" href={telHref(phone)}>{phone}</a></span></li>}
        <li className="flex gap-2"><MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><address className="not-italic"><span className="sr-only">Address: </span>{COMPANY.address.map((l) => <span key={l} className="block">{l}</span>)}</address></li>
      </ul>
      {social && <SocialLinks className={compact ? 'mt-3 text-[13px]' : 'mt-4'} />}
    </div>
  );
}
