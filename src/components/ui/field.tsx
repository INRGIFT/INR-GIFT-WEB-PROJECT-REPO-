'use client';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

/**
 * Form controls. Every control has a visible label, an optional hint and an error wired with aria-describedby,
 * so forms never rely on placeholder text or colour alone.
 */
interface Base { label: ReactNode; hint?: ReactNode; error?: string | null; className?: string; optional?: boolean }
function Wrap({ id, label, hint, error, className, optional, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}{optional && <span className="ml-1 font-normal text-faint">(optional)</span>}</label>
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1.5 text-[13px] text-down">{error}</p> : hint ? <p id={`${id}-hint`} className="hint">{hint}</p> : null}
    </div>
  );
}
const describedBy = (id: string, b: Base) => (b.error ? `${id}-err` : b.hint ? `${id}-hint` : undefined);

export function TextField({ label, hint, error, className, optional, id: given, ...rest }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>) {
  const auto = useId(), id = given ?? auto;
  return <Wrap {...{ id, label, hint, error, className, optional }}><input id={id} className="field" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, { label, hint, error })} {...rest} /></Wrap>;
}
export function PasswordField({ label, hint, error, className, id: given, ...rest }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'>) {
  const auto = useId(), id = given ?? auto;
  const [show, setShow] = useState(false);
  return (
    <Wrap {...{ id, label, hint, error, className }}>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} className="field pr-11" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, { label, hint, error })} {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-ctl text-faint transition-colors hover:text-navy">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div>
    </Wrap>
  );
}
export function SelectField({ label, hint, error, className, optional, id: given, children, ...rest }: Base & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>) {
  const auto = useId(), id = given ?? auto;
  return <Wrap {...{ id, label, hint, error, className, optional }}><select id={id} className="field pr-8" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, { label, hint, error })} {...rest}>{children}</select></Wrap>;
}
export function TextArea({ label, hint, error, className, optional, id: given, ...rest }: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>) {
  const auto = useId(), id = given ?? auto;
  return <Wrap {...{ id, label, hint, error, className, optional }}><textarea id={id} className="field h-auto min-h-[112px] py-2 leading-relaxed" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, { label, hint, error })} {...rest} /></Wrap>;
}
/** Six-digit one-time code. Uses the platform autofill hint so SMS codes fill themselves on phones. */
export function CodeField({ label = 'Verification code', value, onChange, error, hint, autoFocus }: { label?: string; value: string; onChange: (v: string) => void; error?: string | null; hint?: ReactNode; autoFocus?: boolean }) {
  const id = useId();
  return (
    <Wrap {...{ id, label, hint, error }}>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} autoFocus={autoFocus}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} placeholder="••••••"
        className="field num h-12 max-w-[220px] text-center font-display text-xl font-bold tracking-[.5em] placeholder:tracking-[.3em]" />
    </Wrap>
  );
}
/** On/off setting. A real checkbox underneath, so it works with keyboard, forms and screen readers. */
export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer"><span className="block font-medium">{label}</span>{description && <span className="block text-[13px] text-slate2">{description}</span>}</label>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer absolute inset-0 z-[1] cursor-pointer opacity-0 disabled:cursor-not-allowed" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden className={cn('h-6 w-10 rounded-full transition-colors duration-micro peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand', checked ? 'bg-brand' : 'bg-line2', disabled && 'opacity-50')} />
        <span aria-hidden className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform duration-micro ease-out', checked && 'translate-x-4')} />
      </span>
    </div>
  );
}
export function Checkbox({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 py-1">
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0"><span className="block">{label}</span>{description && <span className="block text-xs text-faint">{description}</span>}</span>
    </label>
  );
}
/** Pill toggles for choosing several options, e.g. regions during onboarding. */
export function ChoiceChips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly (readonly [T, string])[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => { const on = value.includes(v); return <button key={v} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])} className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-micro', on ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line2 bg-white text-slate2 hover:border-faint hover:text-navy')}>{on && <span aria-hidden className="mr-1">✓</span>}{text}</button>; })}
      </div>
    </fieldset>
  );
}
