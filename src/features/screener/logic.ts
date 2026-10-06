import { METRICS, METRIC_KEYS } from '@/lib/metrics';
import type { Asset, MetricKey } from '@/lib/types';
import { CLASS_LABEL } from '@/lib/routes';

/** Pure screener logic: field registry, evaluation, and URL encoding. No React, fully unit-tested. */
export type TextField = 'name';
export type CatField = 'cls' | 'region' | 'country' | 'exchange' | 'sector' | 'industry' | 'currency';
export type Field = MetricKey | CatField | TextField | 'price';
export type Op = 'gte' | 'lte' | 'between' | 'is' | 'not' | 'in' | 'contains';
export interface Rule { field: Field; op: Op; value: string; value2?: string }
export interface Group { op: 'AND' | 'OR'; rules: Node[] }
export type Node = Rule | Group;
export const isGroup = (n: Node): n is Group => 'rules' in n;

export const CAT_FIELDS: Record<CatField, string> = { cls: 'Asset type', region: 'Region', country: 'Country', exchange: 'Exchange', sector: 'Sector', industry: 'Industry', currency: 'Currency' };
export type FieldKind = 'number' | 'category' | 'text';
export const fieldKind = (f: Field): FieldKind => (f === 'name' ? 'text' : f in CAT_FIELDS ? 'category' : 'number');
export const fieldLabel = (f: Field): string => (f === 'name' ? 'Name or ticker' : f === 'price' ? 'Price (local currency)' : f in CAT_FIELDS ? CAT_FIELDS[f as CatField] : METRICS[f as MetricKey].label);
export const OPS: Record<FieldKind, [Op, string][]> = { number: [['gte', 'is at least'], ['lte', 'is at most'], ['between', 'is between']], category: [['is', 'is'], ['not', 'is not'], ['in', 'is any of']], text: [['contains', 'contains']] };
/** Fields grouped the way the picker shows them. */
export const FIELD_GROUPS: [string, Field[]][] = [
  ['Asset metadata', ['name', 'cls', 'region', 'country', 'exchange', 'sector', 'industry', 'currency']],
  ['Market', ['price', ...METRIC_KEYS.filter((k) => METRICS[k].category === 'Market')]],
  ...(['Performance', 'Valuation', 'Fundamental', 'Growth', 'Dividend', 'Risk', 'Technical', 'Fund'] as const).map((c): [string, Field[]] => [c, METRIC_KEYS.filter((k) => METRICS[k].category === c)]),
];
export function fieldValue(a: Asset, f: Field): number | string | null | undefined {
  if (f === 'name') return `${a.name} ${a.symbol}`;
  if (f === 'price') return a.price;
  if (f === 'cls') return CLASS_LABEL[a.cls].many;
  if (f in CAT_FIELDS) return a[f as Exclude<CatField, 'cls'>] ?? null;
  const v = a.m[f as MetricKey];
  // Market cap and AUM are entered in billions of USD in the UI.
  return v != null && (f === 'marketCap' || f === 'aum') ? v / 1e9 : v;
}
export function categoryOptions(assets: Asset[], f: CatField): string[] { return [...new Set(assets.map((a) => fieldValue(a, f)).filter((v): v is string => typeof v === 'string'))].sort(); }

export function matchRule(a: Asset, r: Rule): boolean {
  const v = fieldValue(a, r.field);
  if (v == null) return false; // unavailable or not applicable never matches
  const kind = fieldKind(r.field);
  if (kind === 'text') return r.value.trim() === '' || String(v).toLowerCase().includes(r.value.trim().toLowerCase());
  if (kind === 'category') { const list = r.value.split('|').filter(Boolean); if (!list.length) return true; return r.op === 'not' ? !list.includes(String(v)) : list.includes(String(v)); }
  const n = Number(r.value), x = v as number;
  if (r.value.trim() === '' || Number.isNaN(n)) return true; // an unfinished rule does not filter
  if (r.op === 'gte') return x >= n;
  if (r.op === 'lte') return x <= n;
  const hi = Number(r.value2);
  return x >= n && (r.value2 == null || r.value2.trim() === '' || Number.isNaN(hi) || x <= hi);
}
export function evaluate(node: Node, a: Asset): boolean {
  if (!isGroup(node)) return matchRule(a, node);
  if (!node.rules.length) return true;
  return node.op === 'AND' ? node.rules.every((n) => evaluate(n, a)) : node.rules.some((n) => evaluate(n, a));
}
export const runScreen = (tree: Group, assets: Asset[]) => assets.filter((a) => evaluate(tree, a));
export const countRules = (n: Node): number => (isGroup(n) ? n.rules.reduce((s, r) => s + countRules(r), 0) : 1);

/* Immutable tree edits addressed by index path, e.g. [1, 0]. */
export function updateAt(tree: Group, path: number[], fn: (n: Node) => Node | null): Group {
  if (!path.length) return (fn(tree) as Group) ?? { op: 'AND', rules: [] };
  const [head, ...rest] = path;
  const rules = tree.rules.flatMap((n, i) => { if (i !== head) return [n]; const next = rest.length && isGroup(n) ? updateAt(n, rest, fn) : fn(n); return next ? [next] : []; });
  return { ...tree, rules };
}
export const DEFAULT_TREE: Group = { op: 'AND', rules: [{ field: 'marketCap', op: 'gte', value: '100' }, { op: 'OR', rules: [{ field: 'revenueGrowth', op: 'gte', value: '10' }, { field: 'dividendYield', op: 'gte', value: '3' }] }] };

/* Share-ready URL encoding. Validates shape on decode so a tampered link cannot inject anything. */
const b64 = { enc: (s: string) => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s: string) => { const p = s.replace(/-/g, '+').replace(/_/g, '/'); return typeof atob === 'function' ? decodeURIComponent(escape(atob(p))) : Buffer.from(p, 'base64').toString('utf8'); } };
const VALID_FIELD = new Set<string>(['name', 'price', ...Object.keys(CAT_FIELDS), ...METRIC_KEYS]);
const VALID_OP = new Set<string>(['gte', 'lte', 'between', 'is', 'not', 'in', 'contains']);
function sanitize(n: unknown, depth = 0): Node | null {
  if (!n || typeof n !== 'object' || depth > 4) return null;
  const o = n as Record<string, unknown>;
  if (Array.isArray(o.rules)) return { op: o.op === 'OR' ? 'OR' : 'AND', rules: o.rules.slice(0, 20).map((r) => sanitize(r, depth + 1)).filter((r): r is Node => r !== null) };
  if (typeof o.field !== 'string' || !VALID_FIELD.has(o.field) || typeof o.op !== 'string' || !VALID_OP.has(o.op)) return null;
  return { field: o.field as Field, op: o.op as Op, value: String(o.value ?? '').slice(0, 200), ...(o.value2 != null ? { value2: String(o.value2).slice(0, 40) } : {}) };
}
export const encodeTree = (t: Group) => b64.enc(JSON.stringify(t));
export function decodeTree(s: string): Group | null { try { const n = sanitize(JSON.parse(b64.dec(s))); return n && isGroup(n) ? n : null; } catch { return null; } }
export function toCsv(assets: Asset[], columns: MetricKey[]): string {
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [['Symbol', 'Name', 'Type', 'Exchange', 'Country', 'Currency', 'Price', ...columns.map((c) => METRICS[c].label)], ...assets.map((a) => [a.symbol, a.name, CLASS_LABEL[a.cls].one, a.exchange, a.country, a.currency, a.price, ...columns.map((c) => a.m[c] ?? '')])].map((r) => r.map(esc).join(',')).join('\n');
}
