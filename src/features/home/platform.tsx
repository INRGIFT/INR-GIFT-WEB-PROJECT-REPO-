import { Bell, Bookmark, CalendarClock, Clock3, Coins, Compass, Database, Eye, Fingerprint, Globe2, KeyRound, LayoutDashboard, LifeBuoy, Lock, Newspaper, ScrollText, ShieldCheck, Star, Workflow as WorkflowIcon } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/data-status';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';
import { smsSecondFactor } from '@/lib/config';
import type { DataStatus } from '@/lib/types';
import { HomeSection, SectionHeading } from './home-ui';
import { SessionCta } from './session-cta';
import type { HomeSnapshot } from './snapshot';
import { IstClock } from './ist-clock';
import { istHours } from './world-markets';

/** What the platform does with data, in facts that are true of the code today (no counts, partners or certificates). */
export const INFRASTRUCTURE = [
  { icon: Database, title: 'One market-data layer', body: 'Every page reads prices through one service and one provider contract, so a licensed source replaces the demo without changing a screen.' },
  { icon: Fingerprint, title: 'Instrument identity', body: 'Issuer, security and listing are kept apart. Instruments carry permanent internal ids; tickers can change without breaking anything.' },
  { icon: Clock3, title: 'Exchange-aware sessions', body: 'Open, closed, pre-market, breaks and after hours come from each exchange’s own hours, shown on India time.' },
  { icon: CalendarClock, title: 'Market calendars', body: 'Holidays and half days per exchange. A closed market adds no new bars and says when its data is from.' },
  { icon: Coins, title: 'Native currencies', body: 'Prices stay in the currency they are quoted in. Rupee views are labelled conversions, never silent ones.' },
  { icon: ScrollText, title: 'Provenance', body: 'Each module names its source. Missing values show as a dash, metrics that do not apply as n/a; nothing is filled with zeros.' },
  { icon: Eye, title: 'Transparent status', body: 'A status badge with its own glyph on every data module, so live, delayed, closed or demo data is never confused.' },
  { icon: Globe2, title: 'Exact timestamps', body: 'Every value carries its as-of time, in the venue’s time zone on charts and in IST across the product.' },
  { icon: WorkflowIcon, title: 'Research workflows', body: 'Search, screen, compare, research and save in one flow, with links that can be shared and reopened.' },
  { icon: Newspaper, title: 'News intelligence', body: 'Headlines classified for market relevance and matched to companies and markets conservatively, with the reasons kept.' },
];
const STATUSES: DataStatus[] = ['LIVE', 'DELAYED', 'END_OF_DAY', 'CLOSED', 'STALE', 'UNAVAILABLE', 'ERROR', 'DEMO'];

export function Infrastructure() {
  return (
    <HomeSection id="infrastructure" surface="white">
      <SectionHeading id="infrastructure" eyebrow="Data infrastructure" title="Built for financial research."
        lead="The parts of a research platform nobody sees until they go wrong: identity, calendars, currencies, provenance and status. INRGIFT treats them as the product." />
      <dl data-reveal className="mt-12 grid gap-x-10 border-t border-line sm:grid-cols-2 xl:gap-x-16">
        {INFRASTRUCTURE.map(({ icon: Icon, title, body }) => (
          <div key={title} className="border-b border-line py-6">
            <dt className="flex items-center gap-4 font-display text-[16px] font-bold text-navy"><Icon size={20} aria-hidden className="shrink-0 text-brand" />{title}</dt>
            <dd className="mt-1 pl-9 text-[14px] leading-relaxed text-slate2">{body}</dd>
          </div>
        ))}
      </dl>
      <div data-reveal className="mt-10 rounded-card border border-line bg-bg px-5 py-5 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">Every value carries one of these statuses and an exact time</p>
        <ul className="mt-3 flex flex-wrap gap-2">{STATUSES.map((s) => <li key={s}><StatusBadge status={s} className="px-2 py-1 text-[12px]" /></li>)}</ul>
      </div>
    </HomeSection>
  );
}

const SIDEBAR: [string, typeof Star][] = [['Home', LayoutDashboard], ['Discover', Compass], ['Markets', Globe2], ['Watchlists', Star], ['Alerts', Bell], ['Saved Research', Bookmark]];
/** "Your markets. Your research. Your watch.": the signed-in workspace, drawn with its real labels and empty states. */
export function WorkspacePreview() {
  return (
    <HomeSection id="workspace" surface="tint">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div>
          <SectionHeading id="workspace" eyebrow="Private workspace" title="Your markets. Your research. Your watch."
            lead="Watchlists, saved research, alerts and notes in a workspace that belongs to your account. Only your account can read it: the database itself refuses every other one." />
          <ul data-reveal className="mt-8 space-y-3 text-[15px] text-navy">
            {['Watchlists across markets and asset classes', 'Saved research, screens and comparisons', 'Alerts that notify you, and only notify', 'A home dashboard with markets, news and your lists', 'Notes and collections for your own research'].map((t) => <li key={t} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />{t}</li>)}
          </ul>
          <div data-reveal className="mt-9"><SessionCta out={['Create Your Workspace', '/signup']} inside={['Open Your Workspace', '/app']} arrow /></div>
        </div>
        <figure data-reveal aria-label="The INRGIFT workspace, as a new account sees it" className="overflow-hidden rounded-card border border-line bg-white shadow-raised">
          <div className="flex items-center gap-1.5 border-b border-line bg-bg px-4 py-2.5" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-line2" /><span className="h-2.5 w-2.5 rounded-full bg-line2" /><span className="h-2.5 w-2.5 rounded-full bg-line2" /><span className="ml-3 text-[11.5px] text-faint">inrgift.com/app</span></div>
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[168px_minmax(0,1fr)]">
            <ul className="hidden border-r border-line px-2 py-3 sm:block" aria-label="Workspace sections">
              {SIDEBAR.map(([label, Icon], i) => <li key={label} className={i === 0 ? 'flex items-center gap-2 rounded-lg bg-brand-soft px-2.5 py-2 text-[13px] font-semibold text-brand-ink' : 'flex items-center gap-2 px-2.5 py-2 text-[13px] text-slate2'}><Icon size={15} aria-hidden />{label}</li>)}
            </ul>
            <div className="px-5 py-5">
              <p className="font-display text-[20px] font-extrabold text-navy">Hola AMIGO</p>
              <p className="text-[13px] text-slate2">Welcome back to your global market research workspace.</p>
              <div className="mt-4 grid gap-3">
                {[['Watchlists', 'Your watchlists will appear here.', Star], ['Saved Research', 'Research you save will appear here.', Bookmark], ['Alerts', 'Your alerts will appear here.', Bell]].map(([t, body, Icon]) => {
                  const I = Icon as typeof Star;
                  return <div key={t as string} className="flex items-center gap-3 rounded-lg border border-dashed border-line2 px-4 py-3.5"><I size={16} aria-hidden className="text-faint" /><div><p className="text-[13.5px] font-semibold text-navy">{t as string}</p><p className="text-[12.5px] text-slate2">{body as string}</p></div></div>;
                })}
              </div>
            </div>
          </div>
          <figcaption className="border-t border-line px-5 py-3 text-xs text-faint">A new account’s workspace: real labels and empty states, no sample data.</figcaption>
        </figure>
      </div>
    </HomeSection>
  );
}

/** "Built in India. Designed for global markets.": the perspective, stated plainly, with the time where it is built. */
export function BuiltInIndia({ snap }: { snap: HomeSnapshot }) {
  const now = istHours(snap.at);
  const open = snap.markets.ok ? snap.markets.value.filter((m) => m.session === 'OPEN').length : null;
  return (
    <HomeSection id="india" surface="white">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
        <SectionHeading id="india" eyebrow="Perspective" title={<>Built in India.<br />Designed for global markets.</>}
          lead="INRGIFT is built in Surat for people who research the world from here: every session on India time, every price available in rupees, and foreign returns shown with the exchange rate that shapes them." />
        <div data-reveal className="border-l-2 border-saffron pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">In India right now</p>
          <p className="num mt-2 font-display text-[44px] font-extrabold leading-none text-navy"><IstClock initial={now.label} /><span className="ml-2 text-[18px] font-bold text-slate2">IST</span></p>
          {open != null && <p className="mt-3 text-[14px] text-slate2">At {now.label} IST, {open === 1 ? 'one covered market was' : `${open} covered markets were`} in their regular session, by their exchange calendars.</p>}
        </div>
      </div>
    </HomeSection>
  );
}

/** Trust: account security and data practices as implemented (Google only when Supabase has it on), and every support and legal route. */
export function Trust({ google }: { google: boolean }) {
  const pillars = [
    { icon: KeyRound, title: 'Account security', body: `Every account has an email, a mobile number and a password; the email is confirmed with a six-digit code before first sign-in${google ? ', and Google sign-in is available' : ''}. ${smsSecondFactor ? 'Each sign-in also needs a code sent by SMS.' : 'An SMS code at sign-in is being added.'} You can see and end your sessions.` },
    { icon: ShieldCheck, title: 'Data you can check', body: 'Sources, statuses and exact times on every module; demo data labelled as demo; gaps shown as gaps. Methodology explains how each value is read.' },
    { icon: Lock, title: 'Privacy and control', body: 'Your workspace is readable only by your account. Analytics run only with your consent. You can ask for your account to be closed at any time.' },
  ];
  const links: [string, string][] = [['Support', LEGAL_PATHS.support], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure], ['Privacy Policy', LEGAL_PATHS.privacy], ['Terms and Conditions', LEGAL_PATHS.terms], ['Legal', LEGAL_PATHS.legal]];
  return (
    <HomeSection id="trust" surface="tint">
      <SectionHeading id="trust" eyebrow="Trust" title="Research you can rely on starts with honesty."
        lead="INRGIFT is a research and information platform. It is not a broker, an exchange or an investment adviser, and it does not execute transactions or hold client funds." />
      <div data-reveal className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
        {pillars.map(({ icon: Icon, title, body }) => <div key={title} className="bg-white px-6 py-7"><Icon size={22} aria-hidden className="text-brand" /><h3 className="mt-4 font-display text-[18px] font-bold text-navy">{title}</h3><p className="mt-2 text-[14px] leading-relaxed text-slate2">{body}</p></div>)}
      </div>
      <div data-reveal className="mt-8 flex flex-col gap-5 rounded-card border border-line bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Support and legal">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-[14px] font-medium text-navy underline decoration-line2 underline-offset-4 transition-colors hover:text-brand-ink hover:decoration-brand">{l}</Link></li>)}</ul>
        </nav>
        <p className="flex items-center gap-2 text-[14px] text-slate2"><LifeBuoy size={16} aria-hidden className="text-brand" /><a href={`mailto:${COMPANY.supportEmail}`} className="font-semibold text-navy hover:text-brand-ink">{COMPANY.supportEmail}</a></p>
      </div>
    </HomeSection>
  );
}

/** "See the world differently.": the closing call to action. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px)] [background-size:calc(100%/12)_100%]" />
      <div data-reveal className="mx-auto max-w-page px-4 py-24 text-center md:px-6 md:py-32 lg:px-8">
        <p className="eyebrow flex items-center justify-center gap-3 text-ice"><span aria-hidden className="h-px w-7 bg-saffron" />{COMPANY.tagline}</p>
        <h2 id="final-title" className="mx-auto mt-5 max-w-[16ch] font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] md:text-[64px]">See the world differently<span className="text-saffron">.</span></h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-[18px] text-white/75">Research global markets from one intelligent view.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <SessionCta out={['Explore Markets', '/markets']} inside={['Explore Markets', '/markets']} arrow />
          <SessionCta out={['Create Your Workspace', '/signup']} inside={['Open Your Workspace', '/app']} variant="inverse" />
        </div>
      </div>
    </section>
  );
}
