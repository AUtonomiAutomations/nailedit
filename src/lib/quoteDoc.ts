// Formal quote math: calculation lines → discount → VAT. Shared by the owner's editor, the customer page and the PDF.
import type { Line, Quote } from './trades/types';

export const VAT_RATE = 0.18; // Israel, from 1.1.2025
export const QUOTE_VALID_DAYS = 14;
export type DiscountType = 'percent' | 'amount' | null;

const r2 = (n: number) => Math.round(n * 100) / 100;

export function discountAmount(base: number, type: DiscountType, value: number | null) {
  if (!type || !value) return 0;
  return r2(type === 'percent' ? (base * Math.min(100, Math.max(0, value))) / 100 : value);
}

/** Convert "final price the owner wants" into a discount amount against the calculated total */
export const discountForFinal = (base: number, finalPrice: number) => r2(base - finalPrice);

export type QuoteDoc = {
  lines: Line[];          // calculation lines (incl. minimum-price top-up)
  base: number;           // sum of lines
  discount: number;       // positive = discount, negative = surcharge
  discountLabel: string | null;
  gross: number;          // total to pay incl. VAT
  net: number;            // before VAT
  vat: number;
  vatIncluded: boolean;   // were the owner's prices VAT-inclusive
};

export function buildQuoteDoc(q: Quote, type: DiscountType, value: number | null): QuoteDoc {
  const base = r2(q.total);
  const discount = discountAmount(base, type, value);
  const after = r2(base - discount);
  const discountLabel = !discount ? null
    : discount < 0 ? 'תוספת / התאמת מחיר'
    : type === 'percent' ? `הנחה ${value}%` : 'הנחה';
  let gross: number, net: number;
  if (q.vatIncluded) { gross = after; net = r2(after / (1 + VAT_RATE)); }
  else { net = after; gross = r2(after * (1 + VAT_RATE)); }
  return { lines: q.lines, base, discount, discountLabel, gross, net, vat: r2(gross - net), vatIncluded: q.vatIncluded };
}

export const ils2 = (n: number) => '₪' + n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const quoteNo = (issuedAt: string | null, n: number | null) => (n ? `${new Date(issuedAt || Date.now()).getFullYear()}-${String(n).padStart(4, '0')}` : '—');
