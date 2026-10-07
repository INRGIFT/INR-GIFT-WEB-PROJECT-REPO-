'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChoiceChips, SelectField } from '@/components/ui/field';
import { Callout, Change, EmptyState, Skeleton } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { CLASS_LABEL } from '@/lib/routes';
import type { Asset, AssetClass, Region, Theme } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { safeReturnPath } from '@/lib/return-url';
import { AuthCard } from './auth-ui';

const REGIONS: Region[] = ['Asia-Pacific', 'North America', 'Europe', 'Middle East', 'Latin America', 'Africa'];
const CLASSES: AssetClass[] = ['stock', 'etf', 'index', 'fx', 'commodity', 'bond', 'reit'];
const TIMEZONES = [['Asia/Kolkata', 'India (IST)'], ['Asia/Dubai', 'Gulf (GST)'], ['Asia/Singapore', 'Singapore (SGT)'], ['Europe/London', 'United Kingdom'], ['America/New_York', 'US Eastern']] as const;
const STEPS = ['Display', 'Markets', 'Asset classes', 'Themes', 'Watchlist'] as const;

/** Five short, skippable steps. Choices shape defaults (currency, suggested assets); nothing here is required. */
export function Onboarding() {
  const ws = useWorkspace();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<'LOCAL' | 'INR'>(ws.prefs.currency);
  const [timezone, setTimezone] = useState(ws.prefs.timezone);
  const [regions, setRegions] = useState<string[]>(ws.prefs.regions.length ? ws.prefs.regions : ['Asia-Pacific', 'North America']);
  const [classes, setClasses] = useState<string[]>(ws.prefs.assetClasses.length ? ws.prefs.assetClasses : ['stock', 'etf', 'index']);
  const [themes, setThemes] = useState<string[]>(ws.prefs.themes);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const themesApi = useApi<Theme[]>('/api/v1/themes');
  const universe = useApi<Asset[]>(step === 4 ? '/api/v1/assets?class=stocks,etfs,indices,fx,commodities,reits&pageSize=500' : null);
  const suggestions = useMemo(() => {
    if (!universe.data) return [];
    const themed = new Set((themesApi.data ?? []).filter((t) => themes.includes(t.id)).flatMap((t) => t.assetIds));
    const size = (a: Asset) => a.m.marketCap ?? a.m.aum ?? (a.cls === 'index' || a.cls === 'fx' ? 5e11 : 0);
    return universe.data.filter((a) => classes.includes(a.cls) && (a.region === 'Global' || regions.includes(a.region)))
      .sort((x, y) => Number(themed.has(y.id)) - Number(themed.has(x.id)) || size(y) - size(x)).slice(0, 10);
  }, [universe.data, themesApi.data, classes, regions, themes]);
  const chosen = picked ?? suggestions.slice(0, 6).map((a) => a.id);
  const finish = async (skipAll = false) => {
    setSaving(true);
    ws.setPrefs(skipAll ? { onboardedAt: new Date().toISOString() } : { currency, timezone, regions, assetClasses: classes, themes, onboardedAt: new Date().toISOString() });
    if (!skipAll && step === 4) {
      const list = ws.data.watchlists[ws.data.watchlists.length - 1]?.id ?? (await ws.add('watchlists', { name: 'My watchlist', position: 0 }))?.id;
      if (list) for (const [i, id] of chosen.entries()) if (!ws.isWatched(id)) await ws.add('watchlist_items', { watchlist_id: list, instrument_id: id, position: i });
      if (chosen.length) toast(`${chosen.length} assets added to your watchlist`);
    }
    await ws.add('notifications', { category: 'account', title: 'Your workspace is ready', body: 'Preferences saved. Change them any time in Settings.', href: '/account/settings', read: false });
    router.replace(safeReturnPath(params.get('next')));
  };
  if (!ws.ready) return <div className="w-full max-w-[520px] space-y-3"><Skeleton className="h-7 w-1/2" /><Skeleton className="h-40 w-full" /></div>;
  return (
    <div className="w-full max-w-[560px]">
      <ol className="mb-6 grid grid-cols-5 gap-1.5" aria-label="Onboarding progress">
        {STEPS.map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined}><span className={cn('block h-1 rounded-full transition-colors duration-panel', i <= step ? 'bg-brand' : 'bg-line')} /><span className={cn('mt-1.5 hidden text-[11px] sm:block', i === step ? 'font-semibold text-navy' : 'text-faint')}>{s}</span></li>)}
      </ol>
      <div key={step} className="animate-fade-up">
        {step === 0 && <AuthCard title="How should prices appear?" lead="INRGIFT can show every price in its home currency or converted to rupees at the reference rate.">
          <div className="space-y-4">
            <div role="radiogroup" aria-label="Display currency" className="grid gap-2 sm:grid-cols-2">{([['LOCAL', 'Home currency', 'AAPL in $, Toyota in ¥'], ['INR', 'Indian rupees', 'Every price converted to ₹']] as const).map(([v, t, d]) => <button key={v} type="button" role="radio" aria-checked={currency === v} onClick={() => setCurrency(v)} className={cn('rounded-card border p-3.5 text-left transition-colors duration-micro', currency === v ? 'border-brand bg-brand-soft' : 'border-line2 hover:border-faint')}><span className="block font-semibold">{t}</span><span className="text-[13px] text-slate2">{d}</span></button>)}</div>
            <SelectField label="Time zone for dates and sessions" value={timezone} onChange={(e) => setTimezone(e.target.value)}>{TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</SelectField>
          </div>
        </AuthCard>}
        {step === 1 && <AuthCard title="Which regions do you follow?" lead="We use this to order markets and suggest assets. Every market stays available."><ChoiceChips label="Regions" options={REGIONS.map((r) => [r, r] as const)} value={regions} onChange={setRegions} /></AuthCard>}
        {step === 2 && <AuthCard title="Which asset classes interest you?" lead="Choose any. You can research everything regardless."><ChoiceChips label="Asset classes" options={CLASSES.map((c) => [c, CLASS_LABEL[c].many] as const)} value={classes} onChange={setClasses} /></AuthCard>}
        {step === 3 && <AuthCard title="Any themes to follow?" lead="Themes are curated groups across markets. Research on them appears on your overview.">
          {themesApi.loading ? <Skeleton className="h-20 w-full" /> : themesApi.error ? <Callout tone="error" title="Themes could not load">You can choose them later from Collections.</Callout> : <ChoiceChips label="Themes" options={(themesApi.data ?? []).map((t) => [t.id, t.name] as const)} value={themes} onChange={setThemes} />}
        </AuthCard>}
        {step === 4 && <AuthCard title="Start a watchlist" lead="Suggested from your choices. Untick anything you do not want; you can change the list any time.">
          {universe.loading ? <Skeleton className="h-48 w-full" /> : universe.error ? <Callout tone="error" title="Suggestions could not load">Skip this step and add assets from any table with the star.</Callout> : !suggestions.length ? <EmptyState title="No suggestions for those choices">Go back and add a region or asset class, or skip this step.</EmptyState> : (
            <ul className="divide-y divide-line rounded-card border border-line">{suggestions.map((a) => { const on = chosen.includes(a.id); return <li key={a.id}><label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 hover:bg-bg"><input type="checkbox" className="h-4 w-4 accent-brand" checked={on} onChange={() => setPicked(on ? chosen.filter((x) => x !== a.id) : [...chosen, a.id])} /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{a.name}</span><span className="text-xs text-faint">{a.symbol} · {CLASS_LABEL[a.cls].one} · {a.country}</span></span><Change value={a.m.d1} /></label></li>; })}</ul>
          )}
        </AuthCard>}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        <span className="flex-1" />
        <button type="button" className="link mr-2 text-[13px]" onClick={() => finish(true)} disabled={saving}>Skip setup</button>
        {step < 4 ? <Button variant="primary" onClick={() => setStep(step + 1)}>Continue</Button> : <Button variant="primary" onClick={() => finish()} disabled={saving}>{saving ? 'Setting up…' : chosen.length ? `Add ${chosen.length} and finish` : 'Finish'}</Button>}
      </div>
    </div>
  );
}
