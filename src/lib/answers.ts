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

/** One row per form section (e.g. "כתובת איסוף" → "הרצל 12, תל אביב · קומה 3 · ללא מעלית"), for compact documents. */
export function answerRowsBySection(t: TradeConfig, a: Answers, p: Pricing): [string, string][] {
  const short = (l: string) => l.replace(/\s*\(.*?\)\s*/g, ' ').replace(/[?:]/g, '').replace(/\s+–.*$/, '').trim();
  const out: [string, string][] = [];
  for (const s of t.sections) {
    const parts: string[] = [];
    for (const f of s.fields) {
      const v = a[f.key];
      switch (f.type) {
        case 'address': if (v) parts.push(String(v)); break;
        case 'floor': parts.push(floorLabel(v || 0)); break;
        case 'yesno': if (/מעלית/.test(f.label)) parts.push(v ? 'עם מעלית' : 'ללא מעלית'); else if (v) parts.push(short(f.label)); break;
        case 'urgency': { const u = URGENCY_OPTIONS.find((o) => o.value === v); if (u) parts.push(`מועד: ${u.label}`); break; }
        case 'select': { const o = f.options.find((x) => x.value === v); if (o) parts.push(o.label); break; }
        case 'choice': { const it = (p.items[f.group] || []).find((i) => i.key === v); if (it) parts.push(it.name); break; }
        case 'items': {
          const list = Object.entries(v || {}).map(([k, q]) => { const nm = (p.items[f.group] || []).find((i) => i.key === k)?.name || k; return Number(q) > 1 ? `${nm} ×${q}` : nm; });
          if (list.length) parts.push(list.join(', ')); break;
        }
        case 'number': if (Number(v) > 0) parts.push(`${short(f.label)}: ${v}`); break;
        case 'date': if (v) parts.push(`תאריך: ${new Date(v).toLocaleDateString('he-IL')}`); break;
        default: break; // free text (notes) is left out of the document
      }
    }
    if (parts.length) out.push([s.title.replace(/\?$/, ''), parts.join(' · ')]);
  }
  return out;
}
