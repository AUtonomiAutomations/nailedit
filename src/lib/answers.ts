import type { Answers, Pricing, TradeConfig } from './trades/types';
import { URGENCY_OPTIONS } from './pricing';
import { floorLabel } from './utils';

/** Turn raw answers into readable [label, value] rows, driven by the trade's form definition. */
export function answerRows(t: TradeConfig, a: Answers, p: Pricing): [string, string][] {
  const out: [string, string][] = [];
  for (const s of t.sections) for (const f of s.fields) {
    const v = a[f.key];
    let txt = '';
    switch (f.type) {
      case 'yesno': txt = v ? 'כן' : 'לא'; break;
      case 'floor': txt = floorLabel(v || 0); break;
      case 'urgency': txt = URGENCY_OPTIONS.find((o) => o.value === v)?.label || ''; break;
      case 'select': txt = f.options.find((o) => o.value === v)?.label || ''; break;
      case 'choice': txt = (p.items[f.group] || []).find((i) => i.key === v)?.name || ''; break;
      case 'items': txt = Object.entries(v || {}).map(([k, q]) => {
        const nm = (p.items[f.group] || []).find((i) => i.key === k)?.name || k;
        return Number(q) > 1 ? `${nm} ×${q}` : nm;
      }).join(', '); break;
      case 'date': txt = v ? new Date(v).toLocaleDateString('he-IL') : ''; break;
      case 'number': txt = v ? String(v) : ''; break;
      default: txt = v ? String(v) : '';
    }
    if (txt) out.push([f.label.replace(/\?$/, ''), txt]);
  }
  return out;
}
