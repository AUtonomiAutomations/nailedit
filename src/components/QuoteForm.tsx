'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Answers, Field, Pricing, Quote, TradeConfig } from '@/lib/trades/types';
import { buildQuote, rangeText, URGENCY_OPTIONS } from '@/lib/pricing';
import { getDistance, hasGoogle, loadGoogle, DISTANCE_SOURCE_LABEL, type DistanceResult } from '@/lib/distance';
import { floorLabel, waLink } from '@/lib/utils';
import QuoteTicket from './QuoteTicket';

export type QuoteSubmission = {
  customer: { name: string; phone: string };
  answers: Answers;
  quote: Quote;
  distance: DistanceResult | null;
};

function defaults(t: TradeConfig): Answers {
  const a: Answers = {};
  for (const s of t.sections) for (const f of s.fields) {
    if (f.type === 'number') a[f.key] = f.default ?? f.min ?? 0;
    else if (f.type === 'yesno') a[f.key] = f.default ?? false;
    else if (f.type === 'floor') a[f.key] = 0;
    else if (f.type === 'select') a[f.key] = f.default ?? f.options[0]?.value;
    else if (f.type === 'urgency') a[f.key] = 'today';
    else if (f.type === 'items') a[f.key] = {};
    else a[f.key] = '';
  }
  return a;
}

function AddressInput({ id, value, onChange, placeholder, required }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!hasGoogle() || !ref.current) return;
    loadGoogle().then(() => {
      const ac = new window.google.maps.places.Autocomplete(ref.current, { componentRestrictions: { country: 'il' }, fields: ['formatted_address'] });
      ac.addListener('place_changed', () => { const p = ac.getPlace(); if (p?.formatted_address) onChange(p.formatted_address); });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <input id={id} ref={ref} type="text" value={value} required={required} autoComplete="off" placeholder={placeholder || 'לדוגמה: הרצל 12, תל אביב'} onChange={(e) => onChange(e.target.value)} />;
}

export default function QuoteForm({ trade, pricing, businessName, businessPhone, onSubmit, demo = false }: {
  trade: TradeConfig;
  pricing: Pricing;
  businessName: string;
  businessPhone?: string;
  onSubmit?: (s: QuoteSubmission) => Promise<void>;
  demo?: boolean; // landing-page preview: no saving, sample customer
}) {
  const [a, setA] = useState<Answers>(() => (demo ? { ...defaults(trade), ...trade.sampleAnswers } : defaults(trade)));
  const [name, setName] = useState(demo ? 'לקוח לדוגמה' : '');
  const [phone, setPhone] = useState(demo ? '050-0000000' : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<QuoteSubmission | null>(null);
  const set = (k: string, v: any) => setA((p) => ({ ...p, [k]: v }));

  // live estimate (without distance) shown under the submit button in demo mode
  const live = useMemo(() => buildQuote(trade, a, pricing, demo ? trade.sampleDistanceKm ?? null : null), [trade, a, pricing, demo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    for (const s of trade.sections) for (const f of s.fields) {
      if (f.type === 'choice' && f.required && !a[f.key]) return setErr(`בחרו: ${f.label}`);
      if (f.type === 'items' && f.required && !Object.keys(a[f.key] || {}).length) return setErr(`סמנו לפחות פריט אחד: ${f.label}`);
    }
    setBusy(true);
    try {
      let distance: DistanceResult | null = null;
      if (trade.distance) distance = demo ? { km: trade.sampleDistanceKm ?? null, source: 'osm' } : await getDistance(a[trade.distance.from], a[trade.distance.to]);
      const quote = buildQuote(trade, a, pricing, distance?.km ?? null);
      const sub: QuoteSubmission = { customer: { name: name.trim(), phone: phone.trim() }, answers: a, quote, distance };
      if (onSubmit && !demo) await onSubmit(sub);
      setResult(sub);
      if (!demo) window.scrollTo({ top: 0 });
    } catch (e: any) {
      setErr(e?.message || 'משהו השתבש, נסו שוב');
    } finally { setBusy(false); }
  }

  if (result) return <QuoteResult trade={trade} pricing={pricing} s={result} businessName={businessName} businessPhone={businessPhone} demo={demo} onBack={() => setResult(null)} />;

  let n = 1;
  return (
    <form onSubmit={submit} className="stack" noValidate={demo}>
      <div className="card">
        <div className="step-title"><span className="n">{n++}</span><h3>פרטים אישיים</h3></div>
        <div className="form-grid">
          <div className="field"><label htmlFor="c-name">שם מלא</label><input id="c-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="c-phone">טלפון</label><input id="c-phone" type="tel" required pattern="[0-9\-\s+]{9,}" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
      </div>
      {trade.sections.map((s) => (
        <div className="card" key={s.title}>
          <div className="step-title"><span className="n">{n++}</span><h3>{s.title}</h3></div>
          <div className="form-grid">
            {s.fields.map((f) => <FieldView key={f.key} f={f} value={a[f.key]} set={(v) => set(f.key, v)} pricing={pricing} />)}
          </div>
        </div>
      ))}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn accent lg block" disabled={busy}>
        {busy ? <><span className="spin" /> מחשבים...</> : demo ? `הצג הצעת מחיר · ${rangeText(live)}` : 'קבלו הצעת מחיר'}
      </button>
    </form>
  );
}

function FieldView({ f, value, set, pricing }: { f: Field; value: any; set: (v: any) => void; pricing: Pricing }) {
  const id = `f-${f.key}`;
  const half = 'half' in f && f.half;
  const cls = `field${half ? '' : ' full'}`;
  switch (f.type) {
    case 'text': case 'date':
      return <div className={cls}><label htmlFor={id}>{f.label}</label><input id={id} type={f.type} required={f.required} placeholder={f.placeholder} value={value || ''} onChange={(e) => set(e.target.value)} /></div>;
    case 'textarea':
      return <div className={cls}><label htmlFor={id}>{f.label} <span className="muted tiny">(לא חובה)</span></label><textarea id={id} placeholder={f.placeholder} value={value || ''} onChange={(e) => set(e.target.value)} /></div>;
    case 'address':
      return <div className={cls}><label htmlFor={id}>{f.label}</label><AddressInput id={id} value={value || ''} onChange={set} placeholder={f.placeholder} required={f.required} /></div>;
    case 'floor':
      return <div className={cls}><label htmlFor={id}>{f.label}</label>
        <select id={id} value={value ?? 0} onChange={(e) => set(Number(e.target.value))}>
          {Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'קרקע' : floorLabel(i)}</option>)}
        </select></div>;
    case 'yesno':
      return <div className={cls}><span className="label">{f.label}</span>
        <div className="seg" role="group">
          <button type="button" aria-pressed={value === true} onClick={() => set(true)}>כן</button>
          <button type="button" aria-pressed={value === false} onClick={() => set(false)}>לא</button>
        </div></div>;
    case 'number':
      return <div className={cls}><label htmlFor={id}>{f.label}</label>
        <div className="stepper">
          <button type="button" aria-label="פחות" onClick={() => set(Math.max(f.min ?? 0, Number(value || 0) - (f.step || 1)))}>−</button>
          <input id={id} type="number" min={f.min} max={f.max} step={f.step || 1} value={value ?? 0} onChange={(e) => set(Number(e.target.value))} />
          <button type="button" aria-label="יותר" onClick={() => set(Math.min(f.max ?? 9999, Number(value || 0) + (f.step || 1)))}>+</button>
        </div></div>;
    case 'select':
      return <div className={cls}><label htmlFor={id}>{f.label}</label>
        <select id={id} value={value} onChange={(e) => set(e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
    case 'urgency':
      return <div className="field full"><span className="label">{f.label}</span>
        <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {URGENCY_OPTIONS.map((o) => (
            <button type="button" key={o.value} className="choice" aria-pressed={value === o.value} onClick={() => set(o.value)}>
              <b>{o.label}</b><span className="sub">{o.sub}</span>
            </button>))}
        </div></div>;
    case 'choice': {
      const items = pricing.items[f.group] || [];
      return <div className="field full"><span className="label">{f.label}</span>
        <div className="choice-grid">
          {items.map((it) => (
            <button type="button" key={it.key} className="choice" aria-pressed={value === it.key} onClick={() => set(it.key)}><b>{it.name}</b></button>))}
        </div></div>;
    }
    case 'items': {
      const items = pricing.items[f.group] || [];
      const sel: Record<string, number> = value || {};
      const max = f.maxQty ?? 20;
      const toggle = (k: string) => { const n = { ...sel }; if (n[k]) delete n[k]; else n[k] = 1; set(n); };
      const qty = (k: string, d: number) => set({ ...sel, [k]: Math.max(1, Math.min(max, (sel[k] || 1) + d)) });
      return <div className="field full"><span className="label">{f.label}</span>
        <div className="choice-grid">
          {items.map((it) => {
            const on = !!sel[it.key];
            return (
              <div key={it.key} className={`item${on ? ' on' : ''}`} onClick={() => toggle(it.key)} role="checkbox" aria-checked={on} tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(it.key); } }}>
                <input type="checkbox" checked={on} readOnly tabIndex={-1} aria-hidden />
                <span className="nm">{it.name}</span>
                {on && max > 1 && (
                  <span className="qty" onClick={(e) => e.stopPropagation()}>
                    <button type="button" aria-label="פחות" onClick={() => qty(it.key, -1)}>−</button>
                    <span>{sel[it.key]}</span>
                    <button type="button" aria-label="יותר" onClick={() => qty(it.key, 1)}>+</button>
                  </span>)}
              </div>);
          })}
        </div></div>;
    }
  }
}

function QuoteResult({ trade, pricing, s, businessName, businessPhone, demo, onBack }: {
  trade: TradeConfig; pricing: Pricing; s: QuoteSubmission; businessName: string; businessPhone?: string; demo: boolean; onBack: () => void;
}) {
  const km = s.distance?.km;
  const meta = km != null ? `${Math.round(km)} ק״מ` : undefined;
  const summary = `שלום ${businessName}, מילאתי את הטופס וקיבלתי הצעה משוערת: ${rangeText(s.quote)}.\n${trade.summary(s.answers, pricing)}\nשם: ${s.customer.name} · ${s.customer.phone}`;
  return (
    <div className="stack">
      <QuoteTicket quote={s.quote} title="הצעת המחיר שלך" meta={meta} showLines={pricing.showBreakdown} />
      {trade.distance && s.distance?.source === 'none' && <p className="small" style={{ color: 'var(--warn)' }}>לא הצלחנו לחשב מרחק אוטומטית – המחיר לא כולל נסיעה ויעודכן בשיחה.</p>}
      {trade.distance && km != null && s.distance && <p className="tiny muted">מרחק: {DISTANCE_SOURCE_LABEL[s.distance.source]}</p>}
      <div className="card stack" style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 20 }}>{demo ? 'ככה הלקוח רואה את ההצעה' : 'הבקשה התקבלה'}</h3>
        <p className="muted">{demo
          ? 'באותו רגע הבקשה מופיעה אצלך בלוח, עם כל הפרטים, כפתור וואטסאפ וכפתור ניווט.'
          : `זו הערכה ראשונית לפי מה שמילאת. ${businessName} יחזרו אליך לאישור המחיר הסופי ותיאום מועד.`}</p>
        {!demo && businessPhone && <a className="btn wa block" target="_blank" rel="noopener" href={waLink(businessPhone, summary)}>שליחת הפרטים בוואטסאפ</a>}
        {demo && <button type="button" className="btn ghost" onClick={onBack}>חזרה לטופס – שנו פרטים</button>}
      </div>
    </div>
  );
}
