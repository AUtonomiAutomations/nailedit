'use client';
import { useMemo, useState } from 'react';
import { db, type Business, type QuoteRequest } from '@/lib/db';
import { buildQuoteDoc, discountForFinal, ils2, quoteNo, type DiscountType } from '@/lib/quoteDoc';
import { nis } from '@/lib/pricing';
import { waLink } from '@/lib/utils';

type Mode = 'none' | 'percent' | 'amount' | 'final';

/** Owner side of the formal quote: discount → issue → send by WhatsApp → see the customer's signature. */
export default function QuoteManager({ r, business, onChange, toast }: {
  r: QuoteRequest; business: Business; onChange: (patch: Partial<QuoteRequest>) => void; toast: (m: string) => void;
}) {
  const initialMode: Mode = r.discount_type === 'percent' ? 'percent' : r.discount_type === 'amount' ? 'amount' : 'none';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [val, setVal] = useState(r.discount_value ? String(r.discount_value) : '');
  const [busy, setBusy] = useState(false);
  const signed = !!r.signed_at;

  // what will be stored: final-price mode is saved as a ₪ discount against the calculated total
  const { type, value } = useMemo((): { type: DiscountType; value: number | null } => {
    const n = Number(val);
    if (mode === 'none' || !val || Number.isNaN(n)) return { type: null, value: null };
    if (mode === 'final') return { type: 'amount', value: discountForFinal(r.quote.total, n) };
    return { type: mode, value: n };
  }, [mode, val, r.quote.total]);
  const doc = buildQuoteDoc(r.quote, signed ? r.discount_type : type, signed ? r.discount_value : value);
  const dirty = !signed && (type !== r.discount_type || (value ?? null) !== (r.discount_value ?? null));
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const viewUrl = r.quote_token ? `${origin}/quote/${r.quote_token}` : '';
  const pdfUrl = r.quote_token ? (db().mode === 'supabase' ? `${origin}/api/quote/${r.quote_token}/pdf` : `${viewUrl}`) : '';

  async function issue() {
    setBusy(true);
    try {
      const final_price = Math.round(doc.gross);
      const issued = await db().issueQuote(r.id, { discount_type: type, discount_value: value, final_price });
      onChange({ ...issued, discount_type: type, discount_value: value, final_price, status: r.status === 'new' ? 'quoted' : r.status });
      toast(r.quote_token ? 'ההצעה עודכנה' : 'הצעת המחיר הופקה');
    } catch (e: any) { toast(e?.message || 'שגיאה'); } finally { setBusy(false); }
  }

  const msg = `שלום ${r.customer_name}, כאן ${business.name}.\nמצורפת הצעת המחיר שלנו על סך ${nis(doc.gross)} כולל מע״מ.\n\nלצפייה, הורדה ואישור בחתימה דיגיטלית:\n${viewUrl}\n\nלהורדת ה-PDF:\n${pdfUrl}\n\nתודה! ${business.contact_name || ''} ${business.phone}`.trim();

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row">
        <h3>הצעת מחיר רשמית</h3>
        {r.quote_number && <span className="pill st-quoted num">מס׳ {quoteNo(r.issued_at, r.quote_number)}</span>}
        {signed && <span className="pill st-won">נחתמה ✓</span>}
      </div>

      {!signed && (
        <>
          <div className="field">
            <span className="label">מחיר סופי / הנחה</span>
            <div className="seg" role="group" aria-label="סוג הנחה">
              {([['none', 'לפי החישוב'], ['percent', 'הנחה %'], ['amount', 'הנחה ₪'], ['final', 'מחיר סופי']] as [Mode, string][]).map(([m, l]) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setVal(m === 'final' ? String(Math.round(doc.gross)) : ''); }}>{l}</button>))}
            </div>
          </div>
          {mode !== 'none' && (
            <div className="field">
              <label htmlFor="disc-val">{mode === 'percent' ? 'אחוז הנחה' : mode === 'amount' ? 'סכום הנחה (₪)' : 'המחיר שהלקוח ישלם (₪)'}</label>
              <input id="disc-val" type="number" min={0} max={mode === 'percent' ? 100 : undefined} value={val} onChange={(e) => setVal(e.target.value)} />
              {mode === 'final' && <span className="hint">ההפרש מהחישוב יופיע בהצעה כשורת הנחה.</span>}
            </div>)}
        </>
      )}

      <div className="qm-totals num">
        <span>לפי החישוב</span><span dir="ltr">{nis(doc.base)}</span>
        {doc.discount !== 0 && <><span style={{ color: 'var(--bad)' }}>{doc.discountLabel}</span><span dir="ltr" style={{ color: 'var(--bad)' }}>{doc.discount > 0 ? '−' : '+'}{nis(Math.abs(doc.discount))}</span></>}
        <span>לפני מע״מ</span><span dir="ltr">{ils2(doc.net)}</span>
        <span>מע״מ 18%</span><span dir="ltr">{ils2(doc.vat)}</span>
        <b>סה״כ לתשלום</b><b dir="ltr">{nis(doc.gross)}</b>
      </div>

      {signed ? (
        <div className="stack" style={{ gap: 8 }}>
          <div className="banner" style={{ background: 'var(--ok-soft)' }}>
            <b>הלקוח אישר וחתם</b><span>{r.signer_name} · {new Date(r.signed_at!).toLocaleString('he-IL')}</span>
          </div>
          {r.signature_data && <img src={r.signature_data} alt={`חתימה של ${r.signer_name}`} style={{ background: '#fff', borderRadius: 10, maxHeight: 110, border: '1px solid var(--line)', padding: 6 }} />}
        </div>
      ) : (
        <button className="btn accent block" disabled={busy || (!!r.quote_token && !dirty)} onClick={issue}>
          {busy ? 'מפיקים…' : r.quote_token ? (dirty ? 'עדכון ההצעה' : 'ההצעה מעודכנת') : 'אישור והפקת הצעת מחיר'}
        </button>
      )}

      {r.quote_token && (
        <div className="row">
          <a className="btn wa" target="_blank" rel="noopener" href={waLink(r.customer_phone, msg)}
            onClick={(e) => { if (dirty) { e.preventDefault(); toast('יש שינוי שלא נשמר – לחצו קודם "עדכון ההצעה"'); } }}>שליחת הצעת מחיר</a>
          <a className="btn ghost" href={viewUrl} target="_blank" rel="noopener">צפייה</a>
          <a className="btn ghost" href={pdfUrl} target="_blank" rel="noopener">PDF</a>
        </div>
      )}
      {r.quote_token && !signed && <p className="tiny muted">הלקוח מקבל בוואטסאפ קישור להצעה – שם הוא יכול להוריד PDF ולחתום. החתימה תופיע כאן.</p>}
    </div>
  );
}
