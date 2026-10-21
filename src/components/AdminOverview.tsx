'use client';
import { useEffect, useMemo, useState } from 'react';
import { db, type MetricsInput } from '@/lib/db';
import { computeMetrics, type DayPoint } from '@/lib/metrics';
import { SUB_STATUS } from './StatusPill';
import BarChart from './BarChart';
import { daysLeft, fmtDate, fmtDateTime } from '@/lib/utils';
import { nis } from '@/lib/pricing';

const PERIODS = [7, 30, 90];
const pct = (x: number) => `${Math.round(x * 100)}%`;
const n = (x: number) => Math.round(x).toLocaleString('he-IL');

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="stat"><span className="muted small">{label}</span><b>{value}</b>{sub && <span className="tiny muted">{sub}</span>}</div>;
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value || 1);
  return (
    <div className="stack" style={{ gap: 10 }}>
      {steps.map((s, i) => (
        <div key={s.label} className="stack" style={{ gap: 4 }}>
          <div className="row small" style={{ justifyContent: 'space-between' }}>
            <span>{s.label}</span>
            <span className="num"><b>{n(s.value)}</b>{i > 0 && steps[i - 1].value > 0 && <span className="muted"> · {pct(s.value / steps[i - 1].value)} מהשלב הקודם</span>}</span>
          </div>
          <div className="meter"><span style={{ width: `${Math.max(s.value ? 1.5 : 0, (s.value / max) * 100)}%` }} /></div>
        </div>))}
    </div>
  );
}

export default function AdminOverview() {
  const [days, setDays] = useState(30);
  const [raw, setRaw] = useState<MetricsInput | null>(null);
  const [err, setErr] = useState('');
  const [metric, setMetric] = useState<'appOpens' | 'signups' | 'visitors' | 'requests'>('appOpens');
  useEffect(() => { setRaw(null); db().adminMetricsInput(days).then(setRaw).catch((e) => setErr(e?.message || 'שגיאה')); }, [days]);
  const m = useMemo(() => (raw ? computeMetrics(raw, days) : null), [raw, days]);

  if (err) return <div className="card empty">לא הצלחנו לטעון נתונים: {err}</div>;
  if (!m) return <div className="empty">טוען נתונים…</div>;

  const charts: Record<typeof metric, { label: string; data: DayPoint[] }> = {
    appOpens: { label: 'כניסות של בעלי מקצוע לאפליקציה', data: m.series.appOpens },
    signups: { label: 'בעלי מקצוע חדשים', data: m.series.signups },
    visitors: { label: 'מבקרים באתר (ייחודיים)', data: m.series.visitors },
    requests: { label: 'בקשות הצעת מחיר מלקוחות', data: m.series.requests },
  };
  const maxTrade = Math.max(1, ...m.byTrade.map((t) => t.businesses));

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row">
        <h2 style={{ fontSize: 24 }}>סקירה</h2><span className="spacer" />
        <div className="seg" role="group" aria-label="תקופה" style={{ width: 'auto' }}>
          {PERIODS.map((p) => <button key={p} type="button" aria-pressed={days === p} onClick={() => setDays(p)} style={{ padding: '7px 14px', whiteSpace: 'nowrap' }}>{p} ימים</button>)}
        </div>
      </div>

      <section className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">בעלי מקצוע</span>
        <div className="grid g4" style={{ gap: 12 }}>
          <Kpi label="רשומים במערכת" value={n(m.pros.total)} sub={`+${m.pros.new} ב-${days} ימים`} />
          <Kpi label="פעילים השבוע" value={n(m.pros.active7)} sub="נכנסו לאפליקציה ב-7 ימים" />
          <Kpi label="בניסיון / משלמים / לא פעילים" value={`${m.pros.trialing} / ${m.pros.paying} / ${m.pros.lapsed}`} sub={`המרה מניסיון לתשלום: ${pct(m.pros.trialToPaid)}`} />
          <Kpi label="הכנסה חודשית (MRR)" value={nis(m.pros.mrr)} sub="לפני מע״מ" />
        </div>
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">שימוש ולקוחות קצה</span>
        <div className="grid g4" style={{ gap: 12 }}>
          <Kpi label="כניסות לאפליקציה" value={n(m.usage.appOpens)} sub={`${m.usage.logins} התחברויות · ${m.usage.avgOpensPerActive.toFixed(1)} לבעל מקצוע פעיל`} />
          <Kpi label="פתיחות של טופס ההצעה" value={n(m.customers.formViews)} sub={`${n(m.customers.formSubmits)} נשלחו · המרה ${pct(m.customers.conversion)}`} />
          <Kpi label="עבודות שנסגרו" value={n(m.customers.won)} sub={`${pct(m.customers.wonRate)} מהבקשות`} />
          <Kpi label="שווי עבודות שנסגרו" value={nis(m.customers.wonValue)} sub={`מתוך ${nis(m.customers.quotedValue)} שהוצעו`} />
        </div>
      </section>

      <div className="grid g2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <div className="card stack" style={{ gap: 12 }}>
          <div className="tabs">
            {(Object.keys(charts) as (typeof metric)[]).map((k) => (
              <button key={k} className={metric === k ? 'on' : ''} onClick={() => setMetric(k)}>{{ appOpens: 'כניסות', signups: 'הרשמות', visitors: 'מבקרים', requests: 'בקשות' }[k]}</button>))}
          </div>
          <BarChart data={charts[metric].data} label={charts[metric].label} />
        </div>
        <div className="card stack" style={{ gap: 14 }}>
          <b>משפך הרשמה ({days} ימים)</b>
          <Funnel steps={[
            { label: 'מבקרים באתר', value: m.funnel.visitors },
            { label: 'הגיעו לעמוד ההרשמה', value: m.funnel.signupVisitors },
            { label: 'נרשמו', value: m.funnel.signups },
          ]} />
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%' }} />
          <b>משפך לקוחות קצה</b>
          <Funnel steps={[
            { label: 'פתחו לינק של בעל מקצוע', value: m.customers.formViews },
            { label: 'קיבלו הצעה ושלחו', value: m.customers.formSubmits },
            { label: 'נסגרה עבודה', value: m.customers.won },
          ]} />
        </div>
      </div>

      <div className="card">
        <b>לפי מקצוע</b>
        <div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl">
          <thead><tr><th>מקצוע</th><th style={{ width: '30%' }}>בעלי מקצוע</th><th>חדשים</th><th>צפיות בעמוד</th><th>בקשות</th><th>נסגרו</th></tr></thead>
          <tbody>{m.byTrade.map((t) => (
            <tr key={t.slug}>
              <td>{t.name}</td>
              <td><div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><div className="meter" style={{ flex: 1 }}><span style={{ width: `${(t.businesses / maxTrade) * 100}%` }} /></div><span className="num">{t.businesses}</span></div></td>
              <td className="num">{t.newBusinesses}</td><td className="num">{t.landingViews}</td><td className="num">{t.requests}</td><td className="num">{t.won}</td>
            </tr>))}</tbody>
        </table></div>
      </div>

      <div className="grid g2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <div className="card">
          <b>פעילות בעלי מקצוע</b>
          <div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl">
            <thead><tr><th>עסק</th><th>סטטוס</th><th>כניסה אחרונה</th><th>כניסות</th><th>פתיחות טופס</th><th>בקשות</th><th>נסגרו</th></tr></thead>
            <tbody>{m.bizRows.map((b) => (
              <tr key={b.id}>
                <td><b>{b.name}</b><div className="tiny muted">{b.trade} · נרשם {fmtDate(b.created_at)}</div></td>
                <td><span className={`pill st-${b.status}`}>{SUB_STATUS[b.status]}</span></td>
                <td className="small num">{b.last_sign_in_at ? fmtDateTime(b.last_sign_in_at) : '—'}{b.provider === 'google' && <span className="tiny muted"> · Google</span>}</td>
                <td className="num">{b.appOpens}</td><td className="num">{b.formViews}</td><td className="num">{b.requests}</td><td className="num">{b.won}</td>
              </tr>))}</tbody>
          </table></div>
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <b>ניסיונות שמסתיימים השבוע</b>
          {m.trialsEnding.length === 0 ? <p className="muted small">אין ניסיונות שמסתיימים ב-7 הימים הקרובים.</p> :
            m.trialsEnding.map((b) => (
              <div key={b.id} className="row small" style={{ justifyContent: 'space-between' }}>
                <span>{b.name}</span><span className="pill st-trialing">עוד {daysLeft(b.trial_ends_at)} ימים</span>
              </div>))}
          <p className="tiny muted">אלה בעלי המקצוע שכדאי להתקשר אליהם עכשיו לגבי מעבר למסלול בתשלום.</p>
        </div>
      </div>
    </div>
  );
}
