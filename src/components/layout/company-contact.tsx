import { Mail, MapPin, Phone } from 'lucide-react';
import { COMPANY } from '@/lib/company';
import { supportPhone, telHref } from '@/lib/company-server';
import { cn } from '@/lib/format';

/**
 * INRGIFT's published contact details: support email, the phone number only when SUPPORT_PHONE is configured, and the
 * company address. Server component (reads SUPPORT_PHONE at request time).
 */
export function CompanyContact({ className, title = 'Contact', compact = false }: { className?: string; title?: string | null; compact?: boolean }) {
  const phone = supportPhone();
  return (
    <div className={cn('text-[14px] text-slate2', className)}>
      {title && <p className={cn('font-display font-bold text-navy', compact ? 'mb-2 text-[13px]' : 'mb-3 text-base')}>{title}</p>}
      <ul className={cn(compact ? 'space-y-1.5 text-[13px]' : 'space-y-2.5')}>
        <li className="flex gap-2"><Mail size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><span><span className="sr-only">Email: </span><a className="link" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></span></li>
        {phone && <li className="flex gap-2"><Phone size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><span><span className="sr-only">Phone: </span><a className="link" href={telHref(phone)}>{phone}</a></span></li>}
        <li className="flex gap-2"><MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-brand" /><address className="not-italic"><span className="sr-only">Address: </span>{COMPANY.address.map((l) => <span key={l} className="block">{l}</span>)}</address></li>
      </ul>
    </div>
  );
}
