'use client';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBiz } from '@/components/BizContext';
import StatusPill, { STATUS } from '@/components/StatusPill';
import QuoteTicket from '@/components/QuoteTicket';
import { useToast } from '@/components/useToast';
import { db, type QuoteRequest, type RequestStatus } from '@/lib/db';
import { answerRows } from '@/lib/answers';
import { nis, rangeText } from '@/lib/pricing';
import { DISTANCE_SOURCE_LABEL } from '@/lib/distance';
import { fmtDateTime, routeLink, waLink, wazeLink } from '@/lib/utils';

export default function RequestPage({ params }: { params: { id: string } }) {
  const { business, trade, pricing } = useBiz();
  const router = useRouter();
  const toast = useToast();
  const [r, setR] = useState<QuoteRequest | null | undefined>(undefined);
  const [final, setFinal] = useState('');
  const [status, setStatus] = useState<RequestStatus>('new');
  const [notes, setNotes] = useState('');
  const [armDelete, setArmDelete] = useState(false);

  useEffect(() => {
    db().getRequest(params.id).then((x) => {
      setR(x);
      if (x) { setFinal(x.final_price ? String(x.final_price) : ''); setStatus(x.status); setNotes(x.internal_notes || ''); }
    });
  }, [params.id]);

  if (r === undefined) return <div className="empty">טוען…</div>;
  if (!r) return <div className="card empty">הבקשה לא נמצאה. <Link href="/dashboard">חזרה לבקשות</Link></div>;

  const price = final ? nis(Number(final)) : rangeText(r.quote);
  const msg = `שלום ${r.customer_name}, כאן ${business.name}.\nבהמשך לבקשה שלך (${trade.summary(r.answers, pricing)}):\nהמחיר שלנו: ${price}${r.quote.vatIncluded ? ' כולל מע״מ' : ' + מע״מ'}.\nנשמח לתאם! ${business.contact_name || ''} ${business.phone}`;

  async function save(next?: Partial<QuoteRequest>) {
    const patch = { final_price: final ? Number(final) : null, status, internal_notes: notes || null, ...next };
    await db().updateRequest(r!.id, patch);
    setR({ ...r!, ...patch });
    if (next?.status) setStatus(next.status);
    toast.show('נשמר');
  }

  const isMovers = !!trade.distance;
  return (
    <>
      <Link href="/dashboard" className="small">→ חזרה לבקשות</Link>
      <div className="page-title" style={{ marginTop: 10 }}>
        <h1>{r.customer_name}</h1><StatusPill s={r.status} />
        {r.answers.urgency === 'now' && <span className="pill st-lost">דחוף</span>}
        <span className="spacer" />
        <span className="num" style={{ direction: 'ltr' }}>{r.customer_phone}</span>
        <a className="btn ghost sm" href={`tel:${r.customer_phone}`}>חיוג</a>
      </div>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="card stack" style={{ gap: 12 }}>
            <h3>ניווט</h3>
            {isMovers ? (
              <>
                <p className="small muted">{r.answers.pickup} (עצירה) ← {r.answers.dropoff} (יעד)</p>
                <div className="row">
                  <a className="btn" target="_blank" rel="noopener" href={routeLink(r.answers.pickup, r.answers.dropoff)}>מסלול מלא עם עצירה (Google Maps)</a>
                  <a className="btn waze" target="_blank" rel="noopener" href={wazeLink(r.answers.pickup)}>Waze ← איסוף</a>
                  <a className="btn waze" target="_blank" rel="noopener" href={wazeLink(r.answers.dropoff)}>Waze ← פריקה</a>
                </div>
                <p className="tiny muted">Waze לא תומך בהוספת עצירה דרך לינק, לכן יש שני שלבים. המסלול המלא נפתח ב-Google Maps.</p>
              </>
            ) : (
              <div className="row"><a className="btn waze" target="_blank" rel="noopener" href={wazeLink(r.address || '')}>Waze ← {r.address}</a></div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>פרטי הבקשה</h3>
            <dl className="kv">
              {answerRows(trade, r.answers, pricing).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
              {r.distance_km != null && <><dt>מרחק</dt><dd>{Number(r.distance_km).toFixed(1)} ק״מ <span className="tiny muted">({DISTANCE_SOURCE_LABEL[r.distance_source || 'none']})</span></dd></>}
              <dt>התקבל</dt><dd className="num">{fmtDateTime(r.created_at)}</dd>
            </dl>
          </div>
        </div>

        <div className="stack">
          <QuoteTicket quote={r.quote} title="ההצעה שהלקוח ראה" />
          <div className="card stack" style={{ gap: 14 }}>
            <h3>סגירה מול הלקוח</h3>
            <div className="form-grid">
              <div className="field"><label htmlFor="final">מחיר סופי (₪)</label><input id="final" type="number" value={final} placeholder={String(Math.round(r.quote.total))} onChange={(e) => setFinal(e.target.value)} /></div>
              <div className="field"><label htmlFor="status">סטטוס</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
                  {(Object.keys(STATUS) as RequestStatus[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                </select></div>
              <div className="field full"><label htmlFor="notes">הערות פנימיות</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="רק אתה רואה את זה" /></div>
            </div>
            <div className="row">
              <button className="btn" onClick={() => save()}>שמירה</button>
              <a className="btn wa" target="_blank" rel="noopener" href={waLink(r.customer_phone, msg)} onClick={() => { if (r.status === 'new') save({ status: 'quoted' }); }}>שליחת הצעה בוואטסאפ</a>
              <span className="spacer" />
              <button className="btn danger sm" onClick={async () => {
                if (!armDelete) { setArmDelete(true); setTimeout(() => setArmDelete(false), 3000); return; }
                await db().deleteRequest(r.id); router.push('/dashboard');
              }}>{armDelete ? 'לחצו שוב למחיקה' : 'מחיקה'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast.node}
    </>
  );
}
