import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Badge, PageContainer, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';
import { getPlans } from '@/services/content';

export const metadata = pageMetadata({ title: 'Plans and pricing', description: 'INRGIFT is free today. Planned Pro and Enterprise tiers add data depth and research features.', path: '/pricing' });
export default async function PricingPage() {
  const plans = await getPlans();
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={breadcrumbs([['Home', '/'], ['Pricing']])} />
      <PageHeader crumbs={[['Home', '/'], ['Pricing']]} title="Plans" lead="Free today. Paid tiers will differ by data depth and research features, and will be listed here with prices before they launch." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <section key={p.name} aria-labelledby={`plan-${i}`} className={cn('flex flex-col rounded-card border bg-white p-5 shadow-card', i === 0 ? 'border-brand ring-1 ring-brand/30' : 'border-line')}>
            <div className="flex items-center justify-between gap-2"><h2 id={`plan-${i}`} className="text-lg font-bold">{p.name}</h2><Badge tone={i === 0 ? 'up' : 'neutral'}>{p.status}</Badge></div>
            <p className="num mt-2 font-display text-[28px] font-extrabold">{p.price}</p>
            <ul className="mt-4 flex-1 space-y-2 text-[14px]">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-up" aria-hidden />{f}</li>)}</ul>
            <div className="mt-5">{i === 0 ? <ButtonLink href="/signup" variant="primary" className="w-full">Create a free account</ButtonLink> : <ButtonLink href="/support?topic=other" className="w-full">Register interest</ButtonLink>}</div>
          </section>
        ))}
      </div>
      <p className="text-xs text-faint">Tiers differ only by data depth and research features. Market data licences decide which feeds each tier can offer.</p>
    </PageContainer>
  );
}
