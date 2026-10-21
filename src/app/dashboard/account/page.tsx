'use client';
import { useState } from 'react';
import { useBiz } from '@/components/BizContext';
import { SUB_STATUS } from '@/components/StatusPill';
import { useToast } from '@/components/useToast';
import { db } from '@/lib/db';
import { daysLeft, fmtDate } from '@/lib/utils';

export default function AccountPage() {
  const { business, trade, plans, refresh } = useBiz();
  const toast = useToast();
  const [f, setF] = useState({ name: business.name, contact_name: business.contact_name || '', phone: business.phone, city: business.city || '' });
  const current = plans.find((p) => p.id === business.plan_id);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await db().updateMyBusiness(business.id, { ...f, city: f.city || null });
    await refresh(); toast.show('נשמר');
  }

  return (
    <>
      <div className="page-title"><h1>חשבון ומנוי</h1></div>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <form className="card stack" style={{ gap: 14 }} onSubmit={save}>
          <h3>פרטי העסק</h3>
          <div className="field"><label htmlFor="a-name">שם העסק</label><input id="a-name" type="text" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="a-contact">איש קשר</label><input id="a-contact" type="text" value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} /></div>
            <div className="field"><label htmlFor="a-phone">טלפון</label><input id="a-phone" type="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor="a-city">אזור פעילות</label><input id="a-city" type="text" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
          <p className="small muted">מקצוע: {trade.name} · אימייל: <span style={{ direction: 'ltr' }}>{business.email}</span></p>
          <button className="btn" style={{ alignSelf: 'flex-start' }}>שמירה</button>
        </form>
        <div className="stack">
          <div className="card stack" style={{ gap: 8 }}>
            <h3>המנוי שלך</h3>
            <div className="row"><span className={`pill st-${business.subscription_status}`}>{SUB_STATUS[business.subscription_status]}</span><b>{current?.name || '—'}</b></div>
            {business.subscription_status === 'trialing' && business.trial_ends_at && (
              <p className="muted">הניסיון מסתיים ב-{fmtDate(business.trial_ends_at)} (עוד {daysLeft(business.trial_ends_at)} ימים).</p>)}
          </div>
          {plans.filter((p) => p.is_active).map((p) => (
            <div key={p.id} className={`plan${p.id === business.plan_id ? ' featured' : ''}`} style={{ padding: 20, gap: 10 }}>
              <div className="row"><h3 style={{ fontSize: 19 }}>{p.name}</h3><span className="spacer" /><span className="price" style={{ fontSize: 28 }}>₪{p.price_monthly}</span><span className="muted small">/חודש</span></div>
              <ul className="small">{p.features.map((x) => <li key={x}>{x}</li>)}</ul>
              <button className="btn ghost block" disabled title="חיבור לסליקה יתווסף בשלב הבא">בחירת מסלול – בקרוב</button>
            </div>))}
          <p className="tiny muted">התשלום יחובר לחברת סליקה בשלב הבא. בינתיים מנהל המערכת מעדכן מסלולים ידנית.</p>
        </div>
      </div>
      {toast.node}
    </>
  );
}
