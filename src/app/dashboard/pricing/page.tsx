'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBiz } from '@/components/BizContext';
import QuoteTicket from '@/components/QuoteTicket';
import { useToast } from '@/components/useToast';
import { db } from '@/lib/db';
import { allRates, buildQuote, defaultPricing } from '@/lib/pricing';
import type { Pricing } from '@/lib/trades/types';
import { uid } from '@/lib/utils';

function PricingInner() {
  const { business, trade, pricing, refresh } = useBiz();
  const welcome = useSearchParams().get('welcome');
  const toast = useToast();
  const [p, setP] = useState<Pricing>(() => JSON.parse(JSON.stringify(pricing)));
  const [armReset, setArmReset] = useState(false);
  const sample = buildQuote(trade, trade.sampleAnswers, p, trade.sampleDistanceKm ?? null);

  const setRate = (k: string, v: string) => setP({ ...p, rates: { ...p.rates, [k]: Number(v) || 0 } });
  const setItem = (g: string, i: number, k: 'name' | 'price', v: string) => {
    const list = [...(p.items[g] || [])];
    list[i] = { ...list[i], [k]: k === 'price' ? Number(v) || 0 : v };
    setP({ ...p, items: { ...p.items, [g]: list } });
  };
  const addItem = (g: string) => setP({ ...p, items: { ...p.items, [g]: [...(p.items[g] || []), { key: uid().slice(0, 8), name: '', price: 0 }] } });
  const delItem = (g: string, i: number) => setP({ ...p, items: { ...p.items, [g]: (p.items[g] || []).filter((_, j) => j !== i) } });

  async function save() {
    const clean: Pricing = { ...p, items: Object.fromEntries(Object.entries(p.items).map(([g, l]) => [g, l.filter((x) => x.name.trim())])) };
    await db().updateMyBusiness(business.id, { pricing: clean });
    await refresh();
    toast.show('המחירון נשמר');
  }

  return (
    <>
      {welcome && (
        <div className="banner trial" style={{ marginBottom: 18 }}>
          <b>ברוכים הבאים! החשבון מוכן.</b><span>עברו על המחירון ההתחלתי ועדכנו לפי העסק שלכם – ואז שלחו את הלינק הראשון.</span>
          <span className="spacer" /><Link href="/dashboard/link" className="btn sm accent">ללינק שלי</Link>
        </div>)}
      <div className="page-title"><h1>המחירון של {business.name}</h1><span className="spacer" /><button className="btn accent" onClick={save}>שמירת מחירון</button></div>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="card stack" style={{ gap: 14 }}>
            <h3>תעריפים</h3>
            <div className="form-grid">
              {allRates(trade).map((r) => (
                <div className="field" key={r.key}>
                  <label htmlFor={`r-${r.key}`}>{r.label}{r.unit === 'pct' ? '' : ' (₪)'}</label>
                  <input id={`r-${r.key}`} type="number" min={0} step="any" value={p.rates[r.key] ?? 0} onChange={(e) => setRate(r.key, e.target.value)} />
                  {r.hint && <span className="hint">{r.hint}</span>}
                </div>))}
            </div>
            <div className="row">
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={p.vatIncluded} onChange={(e) => setP({ ...p, vatIncluded: e.target.checked })} /> המחירים כוללים מע״מ</label>
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={p.showBreakdown} onChange={(e) => setP({ ...p, showBreakdown: e.target.checked })} /> להציג ללקוח את פירוט החישוב</label>
            </div>
          </div>
          {trade.itemGroups.map((g) => (
            <div className="card stack" key={g.key} style={{ gap: 10 }}>
              <div className="row"><h3>{g.label}</h3><span className="spacer" /><button className="btn ghost sm" onClick={() => addItem(g.key)}>+ הוספה</button></div>
              {g.hint && <p className="hint">{g.hint}</p>}
              <div className="price-row tiny muted"><span>שם</span><span>מחיר (₪)</span><span /></div>
              {(p.items[g.key] || []).map((it, i) => (
                <div className="price-row" key={it.key}>
                  <input type="text" aria-label="שם" value={it.name} onChange={(e) => setItem(g.key, i, 'name', e.target.value)} />
                  <input type="number" aria-label="מחיר" min={0} value={it.price} onChange={(e) => setItem(g.key, i, 'price', e.target.value)} />
                  <button className="icon-btn" aria-label="מחיקה" onClick={() => delItem(g.key, i)}>✕</button>
                </div>))}
            </div>))}
          <div className="row">
            <button className="btn accent" onClick={save}>שמירת מחירון</button>
            <span className="spacer" />
            <button className="btn danger sm" onClick={() => {
              if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 3000); return; }
              setP(defaultPricing(trade)); setArmReset(false); toast.show('הוחזר למחירון ההתחלתי – לחצו שמירה');
            }}>{armReset ? 'לחצו שוב לאישור' : 'חזרה למחירון ההתחלתי'}</button>
          </div>
        </div>
        <div className="stack" style={{ position: 'sticky', top: 80 }}>
          <span className="eyebrow">תצוגה מקדימה – משתנה בזמן אמת</span>
          <QuoteTicket quote={sample} title="דוגמה ללקוח" />
          <p className="tiny muted">לפי תשובות לדוגמה: {trade.summary(trade.sampleAnswers, p)}</p>
        </div>
      </div>
      {toast.node}
    </>
  );
}
export default function PricingPage() { return <Suspense><PricingInner /></Suspense>; }
