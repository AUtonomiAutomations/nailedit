import type { Answers, Item, Line, Pricing, Quote, Rate, TradeConfig } from './trades/types';

/** Rates every trade gets in addition to its own */
export const COMMON_RATES: Rate[] = [
  { key: 'minPrice', label: 'מחיר מינימום לעבודה', default: 250, unit: 'ils' },
  { key: 'rangePct', label: 'טווח הצעה ± (%)', default: 10, unit: 'pct', hint: '0 = מחיר אחד מדויק, 10 = טווח של ±10%' },
];

/** Rates for trades that ask "how urgent is it?" */
export const URGENCY_RATES: Rate[] = [
  { key: 'urgentPct', label: 'תוספת לקריאה דחופה – עכשיו (%)', default: 35, unit: 'pct' },
  { key: 'todayPct', label: 'תוספת לקריאה להיום (%)', default: 15, unit: 'pct' },
  { key: 'nightPct', label: 'תוספת לילה / שבת (%)', default: 50, unit: 'pct', hint: 'כשהלקוח מסמן שהעבודה בלילה או בשבת' },
];

export const URGENCY_OPTIONS = [
  { value: 'now', label: 'דחוף – עכשיו', sub: 'תוך שעתיים' },
  { value: 'today', label: 'היום', sub: 'במהלך היום' },
  { value: 'week', label: 'השבוע', sub: 'בימים הקרובים' },
  { value: 'flex', label: 'גמיש', sub: 'לא דחוף' },
];

export function allRates(t: TradeConfig): Rate[] {
  const own = new Set(t.rates.map((r) => r.key));
  return [...t.rates, ...COMMON_RATES.filter((r) => !own.has(r.key))];
}

export function defaultPricing(t: TradeConfig): Pricing {
  const rates: Record<string, number> = {};
  for (const r of allRates(t)) rates[r.key] = r.default;
  const items: Record<string, Item[]> = {};
  for (const g of t.itemGroups) items[g.key] = g.items.map((i) => ({ ...i }));
  return { rates, items, vatIncluded: true, showBreakdown: true };
}

/** Merge a stored pricing object with the trade defaults (new rates/groups added later get defaults) */
export function normalizePricing(t: TradeConfig, p?: Partial<Pricing> | null): Pricing {
  const d = defaultPricing(t);
  if (!p) return d;
  return {
    rates: { ...d.rates, ...(p.rates || {}) },
    items: { ...d.items, ...(p.items || {}) },
    vatIncluded: p.vatIncluded ?? d.vatIncluded,
    showBreakdown: p.showBreakdown ?? d.showBreakdown,
  };
}

export const r = (p: Pricing, key: string) => Number(p.rates[key] ?? 0);
export const itemOf = (p: Pricing, group: string, key: string) => (p.items[group] || []).find((i) => i.key === key);

/** Lines for an "items" answer: { itemKey: qty } */
export function itemLines(p: Pricing, group: string, sel: Record<string, number> | undefined, unitLabel = ''): Line[] {
  const out: Line[] = [];
  for (const [key, qty] of Object.entries(sel || {})) {
    const it = itemOf(p, group, key);
    if (!it || !qty) continue;
    out.push({ label: `${it.name}${qty > 1 ? ` × ${qty}${unitLabel}` : ''}`, amount: it.price * qty });
  }
  return out;
}

export const sum = (lines: Line[]) => lines.reduce((s, l) => s + l.amount, 0);

/** Urgency / night surcharges as a percentage of the work subtotal */
export function urgencyLines(a: Answers, p: Pricing, base: number): Line[] {
  const out: Line[] = [];
  if (a.urgency === 'now' && r(p, 'urgentPct')) out.push({ label: `קריאה דחופה (+${r(p, 'urgentPct')}%)`, amount: (base * r(p, 'urgentPct')) / 100 });
  if (a.urgency === 'today' && r(p, 'todayPct')) out.push({ label: `ביצוע היום (+${r(p, 'todayPct')}%)`, amount: (base * r(p, 'todayPct')) / 100 });
  if (a.night && r(p, 'nightPct')) out.push({ label: `לילה / שבת (+${r(p, 'nightPct')}%)`, amount: (base * r(p, 'nightPct')) / 100 });
  return out;
}

export const round50 = (n: number) => Math.round(n / 50) * 50;

export function buildQuote(t: TradeConfig, a: Answers, p: Pricing, distanceKm: number | null): Quote {
  const lines = t.compute(a, p, { distanceKm }).filter((l) => l.amount !== 0);
  let total = sum(lines);
  const min = r(p, 'minPrice');
  if (total < min) {
    lines.push({ label: 'השלמה למחיר מינימום', amount: min - total });
    total = min;
  }
  const pct = r(p, 'rangePct') / 100;
  const low = round50(total * (1 - pct));
  const high = round50(total * (1 + pct));
  return { lines, total, low: Math.max(low, 0), high, vatIncluded: p.vatIncluded };
}

export const nis = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
/** Wrapped in LRI…PDI so "₪600 – ₪750" keeps its order inside Hebrew (RTL) text, WhatsApp messages included */
export const rangeText = (q: Pick<Quote, 'low' | 'high'>) => (q.low === q.high ? nis(q.low) : `\u2066${nis(q.low)} – ${nis(q.high)}\u2069`);
