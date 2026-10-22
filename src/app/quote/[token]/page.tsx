'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QuoteDocument from '@/components/QuoteDocument';
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad';
import { db, type PublicQuote } from '@/lib/db';
import { track } from '@/lib/track';
import { buildQuoteDoc } from '@/lib/quoteDoc';
import { nis } from '@/lib/pricing';

function QuotePageInner({ token }: { token: string }) {
  const printMode = useSearchParams().get('print') === '1';
  const [data, setData] = useState<PublicQuote | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [sigEmpty, setSigEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pad = useRef<SignaturePadHandle>(null);

  const load = () => db().getPublicQuote(token).then((q) => { setData(q); if (q) setName((n) => n || q.request.customer_name); }).catch(() => setData(null));
  useEffect(() => {
    load().then(() => { if (!printMode) track({ type: 'quote_view' }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => { if (data && printMode) document.fonts.ready.then(() => document.body.setAttribute('data-ready', '1')); }, [data, printMode]);

  if (data === undefined) return <div className="empty">טוען הצעת מחיר…</div>;
  if (!data) return <main className="container narrow page"><div className="card empty">ההצעה לא נמצאה. בקשו מבעל העסק לשלוח קישור חדש.</div></main>;
  if (printMode) return <div className="print-wrap"><QuoteDocument data={data} /></div>;

  const r = data.request;
  const doc = buildQuoteDoc(r.quote, r.discount_type, r.discount_value);
  const expired = !!r.valid_until && r.valid_until < new Date().toISOString().slice(0, 10) && !r.signed_at;
  const pdfHref = db().mode === 'supabase' ? `/api/quote/${token}/pdf` : null;

  async function sign() {
    setErr('');
    const sig = pad.current?.toDataURL();
    if (name.trim().length < 2) return setErr('נא למלא שם מלא');
    if (!sig) return setErr('נא לחתום באזור החתימה');
    if (!agree) return setErr('נא לסמן שאתם מאשרים את ההצעה');
    setBusy(true);
    try { await db().signQuote(token, name, sig); await load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e: any) { setErr(e?.message || 'החתימה נכשלה'); } finally { setBusy(false); }
  }

  return (
    <main className="quote-page">
      <div className="container narrow no-print stack" style={{ gap: 12, paddingBlock: 20 }}>
        {r.signed_at ? (
          <div className="banner" style={{ background: 'var(--ok-soft)' }}><b>✓ ההצעה אושרה ונחתמה. תודה!</b><span>{data.business.name} יצרו איתך קשר לתיאום.</span></div>
        ) : expired ? (
          <div className="banner bad"><b>תוקף ההצעה פג.</b><span>פנו ל{data.business.name} לקבלת הצעה מעודכנת.</span></div>
        ) : (
          <div className="banner trial"><b>הצעת מחיר מ{data.business.name}: {nis(doc.gross)}</b><span>עיינו בהצעה, ואם הכל מתאים – חתמו למטה ואשרו.</span></div>
        )}
        <div className="row">
          {pdfHref ? <a className="btn" href={pdfHref}>הורדת PDF</a> : <button className="btn" onClick={() => window.print()}>הורדה / הדפסה</button>}
          {!r.signed_at && !expired && <a className="btn accent" href="#sign">לחתימה ואישור ↓</a>}
        </div>
      </div>

      <div className="quote-scroll"><QuoteDocument data={data} /></div>

      {!r.signed_at && !expired && (
        <section id="sign" className="container narrow no-print" style={{ paddingBlock: '28px 64px' }}>
          <div className="card stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: 24 }}>אישור וחתימה על ההצעה</h2>
            <div className="field"><label htmlFor="sig-name">שם מלא</label><input id="sig-name" type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><span className="label">חתימה</span><SignaturePad ref={pad} onChange={setSigEmpty} /></div>
            <label className="row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 5 }} />
              <span>קראתי ואני מאשר/ת את הצעת המחיר של {data.business.name} על סך {nis(doc.gross)} כולל מע״מ.</span>
            </label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn accent lg block" disabled={busy || sigEmpty} onClick={sign}>{busy ? 'שומרים…' : 'אישור וחתימה'}</button>
            <p className="tiny muted">החתימה נשמרת יחד עם ההצעה ונשלחת לבעל העסק.</p>
          </div>
        </section>
      )}
    </main>
  );
}

export default function QuotePage({ params }: { params: { token: string } }) {
  return <Suspense><QuotePageInner token={params.token} /></Suspense>;
}
