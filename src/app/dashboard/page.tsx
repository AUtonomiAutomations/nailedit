'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useBiz } from '@/components/BizContext';
import StatusPill, { STATUS } from '@/components/StatusPill';
import { db, type QuoteRequest, type RequestStatus } from '@/lib/db';
import { nis, rangeText } from '@/lib/pricing';
import { fmtDate, routeLink, wazeLink } from '@/lib/utils';

export default function RequestsPage() {
  const { business, trade, pricing } = useBiz();
  const router = useRouter();
  const [rows, setRows] = useState<QuoteRequest[] | null>(null);
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  useEffect(() => { db().listRequests(business.id).then(setRows); }, [business.id]);

  const stats = useMemo(() => {
    const r = rows || [];
    const won = r.filter((x) => x.status === 'won');
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    return {
      fresh: r.filter((x) => x.status === 'new').length,
      monthCount: r.filter((x) => new Date(x.created_at) >= month).length,
      won: won.length,
      revenue: won.reduce((s, x) => s + Number(x.final_price || x.quote.total), 0),
    };
  }, [rows]);

  const list = (rows || []).filter((r) => filter === 'all' || r.status === filter);
  const isMovers = !!trade.distance;

  return (
    <>
      <div className="page-title"><h1>בקשות להצעת מחיר</h1><span className="spacer" /><Link href="/dashboard/link" className="btn accent">שליחת לינק ללקוח</Link></div>
      <div className="grid g4" style={{ marginBottom: 18, gap: 14 }}>
        <div className="stat"><span className="muted small">חדשות – ממתינות לך</span><b>{stats.fresh}</b></div>
        <div className="stat"><span className="muted small">בקשות החודש</span><b>{stats.monthCount}</b></div>
        <div className="stat"><span className="muted small">עבודות שנסגרו</span><b>{stats.won}</b></div>
        <div className="stat"><span className="muted small">הכנסות מעבודות שנסגרו</span><b>{nis(stats.revenue)}</b></div>
      </div>
      <div className="card">
        <div className="tabs" style={{ marginBottom: 10 }}>
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>הכל</button>
          {(Object.keys(STATUS) as RequestStatus[]).map((s) => <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{STATUS[s]}</button>)}
        </div>
        {rows === null ? <div className="empty">טוען…</div> : list.length === 0 ? (
          <div className="empty">אין בקשות עדיין.<br /><Link href="/dashboard/link">שלחו את הלינק הראשון ללקוח ←</Link></div>
        ) : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>תאריך</th><th>לקוח</th><th>מה צריך</th><th>{isMovers ? 'מסלול' : 'כתובת'}</th><th>הצעה</th><th>סטטוס</th><th>ניווט</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="click" onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) router.push(`/dashboard/requests/${r.id}`); }}>
                  <td className="num">{fmtDate(r.created_at)}</td>
                  <td><b>{r.customer_name}</b><div className="tiny muted num">{r.customer_phone}</div></td>
                  <td className="small">{isMovers ? `${r.answers.boxes || 0} ארגזים` : trade.summary(r.answers, pricing)}{r.answers.urgency === 'now' && <span className="pill st-lost" style={{ marginInlineStart: 6 }}>דחוף</span>}</td>
                  <td className="small">{isMovers ? <>{r.answers.pickup}<br />← {r.answers.dropoff}</> : r.address}</td>
                  <td className="num"><b>{r.final_price ? nis(r.final_price) : rangeText(r.quote)}</b></td>
                  <td><StatusPill s={r.status} /></td>
                  <td><div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <a className="btn waze sm" target="_blank" rel="noopener" href={wazeLink(r.address || '')}>Waze</a>
                    {isMovers && <a className="btn ghost sm" target="_blank" rel="noopener" href={routeLink(r.answers.pickup, r.answers.dropoff)}>מסלול מלא</a>}
                  </div></td>
                </tr>))}
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
