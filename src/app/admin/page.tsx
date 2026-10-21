'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { SUB_STATUS } from '@/components/StatusPill';
import { useToast } from '@/components/useToast';
import { db, type AppSettings, type Business, type Plan, type SubscriptionStatus } from '@/lib/db';
import { resetLocalDemo } from '@/lib/db/local';
import { TRADES, getTrade } from '@/lib/trades';
import { daysLeft, fmtDate } from '@/lib/utils';

type Tab = 'businesses' | 'plans' | 'settings';

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('businesses');
  const [biz, setBiz] = useState<Business[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; won: number; last30: number }>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [armReset, setArmReset] = useState(false);

  const load = useCallback(async () => {
    const u = await db().getUser();
    if (!u) return router.replace('/login');
    if (u.role !== 'admin') return setOk(false);
    setOk(true);
    const [b, s, p, st] = await Promise.all([db().listBusinesses(), db().requestStats(), db().listPlans(true), db().getSettings()]);
    setBiz(b); setStats(s); setPlans(p); setSettings(st);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  if (ok === null) return <div className="empty">טוען…</div>;
  if (!ok) return <main className="container page"><div className="card empty">אין לך הרשאת מנהל. <Link href="/dashboard">ללוח שלי</Link></div></main>;

  const totals = Object.values(stats).reduce((a, s) => ({ total: a.total + s.total, won: a.won + s.won, last30: a.last30 + s.last30 }), { total: 0, won: 0, last30: 0 });
  const trialing = biz.filter((b) => b.subscription_status === 'trialing').length;
  const paying = biz.filter((b) => b.subscription_status === 'active');
  const mrr = paying.reduce((s, b) => s + Number(plans.find((p) => p.id === b.plan_id)?.price_monthly || 0), 0);

  async function updBiz(id: string, patch: Partial<Business>) { await db().adminUpdateBusiness(id, patch); toast.show('עודכן'); load(); }
  async function savePlan(p: Plan) { await db().upsertPlan(p); toast.show('המסלול נשמר'); load(); }

  return (
    <>
      <div className="topbar"><div className="container">
        <Logo href="/admin" /><span className="pill st-trialing">ניהול מערכת</span>
        <nav className="tabs">
          <button className={tab === 'businesses' ? 'on' : ''} onClick={() => setTab('businesses')}>עסקים</button>
          <button className={tab === 'plans' ? 'on' : ''} onClick={() => setTab('plans')}>מסלולים</button>
          <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>הגדרות ניסיון</button>
        </nav>
        <span className="spacer" />
        <span className="tiny muted">{db().mode === 'local' ? 'מצב דמו (מקומי)' : 'Supabase'}</span>
        <button className="btn ghost sm" onClick={async () => { await db().signOut(); router.push('/login'); }}>יציאה</button>
      </div></div>
      <main className="container page">
        <div className="grid g4" style={{ marginBottom: 18, gap: 14 }}>
          <div className="stat"><span className="muted small">עסקים רשומים</span><b>{biz.length}</b></div>
          <div className="stat"><span className="muted small">בניסיון / משלמים</span><b>{trialing} / {paying.length}</b></div>
          <div className="stat"><span className="muted small">הכנסה חודשית (MRR)</span><b>₪{mrr.toLocaleString('he-IL')}</b></div>
          <div className="stat"><span className="muted small">בקשות ב-30 יום</span><b>{totals.last30}</b></div>
        </div>

        {tab === 'businesses' && (
          <div className="card"><div className="table-wrap"><table className="tbl">
            <thead><tr><th>עסק</th><th>מקצוע</th><th>נרשם</th><th>סטטוס</th><th>ניסיון עד</th><th>מסלול</th><th>בקשות (30 יום)</th><th>נסגרו</th><th /></tr></thead>
            <tbody>{biz.map((b) => {
              const s = stats[b.id] || { total: 0, won: 0, last30: 0 };
              return (
                <tr key={b.id}>
                  <td><b>{b.name}</b><div className="tiny muted">{b.contact_name} · <span style={{ direction: 'ltr' }}>{b.phone}</span></div></td>
                  <td>{getTrade(b.trade_slug)?.name}</td>
                  <td className="num">{fmtDate(b.created_at)}</td>
                  <td><select value={b.subscription_status} onChange={(e) => updBiz(b.id, { subscription_status: e.target.value as SubscriptionStatus })} style={{ padding: '5px 8px' }}>
                    {Object.entries(SUB_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td className="num small">{b.trial_ends_at ? `${fmtDate(b.trial_ends_at)} (${daysLeft(b.trial_ends_at)})` : '—'}</td>
                  <td><select value={b.plan_id || ''} onChange={(e) => updBiz(b.id, { plan_id: e.target.value || null })} style={{ padding: '5px 8px' }}>
                    <option value="">—</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                  <td className="num">{s.total} ({s.last30})</td>
                  <td className="num">{s.won}</td>
                  <td><button className="btn ghost sm" onClick={() => updBiz(b.id, { trial_ends_at: new Date(Math.max(Date.now(), new Date(b.trial_ends_at || 0).getTime()) + 14 * 86400000).toISOString(), subscription_status: 'trialing' })}>+14 ימי ניסיון</button></td>
                </tr>);
            })}</tbody>
          </table></div></div>
        )}

        {tab === 'plans' && (
          <div className="stack">
            {plans.map((p) => <PlanEditor key={p.id} plan={p} onSave={savePlan} onDelete={async () => { await db().deletePlan(p.id); load(); }} />)}
            <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setPlans([...plans, { id: `plan${plans.length + 1}`, name: 'מסלול חדש', price_monthly: 0, lead_limit: null, features: [], is_active: false, sort_order: plans.length + 1 }])}>+ מסלול חדש</button>
          </div>
        )}

        {tab === 'settings' && settings && (
          <div className="grid g2" style={{ alignItems: 'start' }}>
            <form className="card stack" style={{ gap: 14 }} onSubmit={async (e) => { e.preventDefault(); await db().updateSettings({ trial_days: settings.trial_days, trial_plan_id: settings.trial_plan_id }); toast.show('ההגדרות נשמרו'); }}>
              <h3>תקופת ניסיון לנרשמים חדשים</h3>
              <div className="form-grid">
                <div className="field"><label htmlFor="td">ימי ניסיון</label><input id="td" type="number" min={0} value={settings.trial_days} onChange={(e) => setSettings({ ...settings, trial_days: Number(e.target.value) })} />
                  <span className="hint">0 = בלי ניסיון. משפיע רק על נרשמים חדשים.</span></div>
                <div className="field"><label htmlFor="tp">מסלול בזמן הניסיון</label>
                  <select id="tp" value={settings.trial_plan_id || ''} onChange={(e) => setSettings({ ...settings, trial_plan_id: e.target.value || null })}>
                    <option value="">—</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
              <button className="btn" style={{ alignSelf: 'flex-start' }}>שמירה</button>
            </form>
            <div className="card stack" style={{ gap: 10 }}>
              <h3>מקצועות פעילים</h3>
              <p className="small muted">{TRADES.map((t) => t.name).join(' · ')}</p>
              <p className="tiny muted">הטפסים והמחירונים של כל מקצוע מוגדרים בקוד: src/lib/trades.</p>
              {db().mode === 'local' && (
                <button className="btn danger sm" style={{ alignSelf: 'flex-start' }} onClick={() => {
                  if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 3000); return; }
                  resetLocalDemo(); router.push('/login');
                }}>{armReset ? 'לחצו שוב לאיפוס' : 'איפוס נתוני הדמו'}</button>)}
            </div>
          </div>
        )}
      </main>
      {toast.node}
    </>
  );
}

function PlanEditor({ plan, onSave, onDelete }: { plan: Plan; onSave: (p: Plan) => void; onDelete: () => void }) {
  const [p, setP] = useState(plan);
  const [arm, setArm] = useState(false);
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="field"><label>מזהה</label><input type="text" value={p.id} disabled={!!plan.name && plan.id === p.id && plan.price_monthly > 0} onChange={(e) => setP({ ...p, id: e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase() })} style={{ direction: 'ltr' }} /></div>
        <div className="field"><label>שם</label><input type="text" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
        <div className="field"><label>מחיר לחודש (₪)</label><input type="number" min={0} value={p.price_monthly} onChange={(e) => setP({ ...p, price_monthly: Number(e.target.value) })} /></div>
        <div className="field"><label>מגבלת בקשות לחודש</label><input type="number" min={0} value={p.lead_limit ?? ''} placeholder="ללא הגבלה" onChange={(e) => setP({ ...p, lead_limit: e.target.value === '' ? null : Number(e.target.value) })} /></div>
        <div className="field"><label>סדר</label><input type="number" value={p.sort_order} onChange={(e) => setP({ ...p, sort_order: Number(e.target.value) })} /></div>
      </div>
      <div className="field"><label>יתרונות (שורה לכל יתרון)</label><textarea value={p.features.join('\n')} onChange={(e) => setP({ ...p, features: e.target.value.split('\n') })} /></div>
      <div className="row">
        <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={p.is_active} onChange={(e) => setP({ ...p, is_active: e.target.checked })} /> מוצג באתר</label>
        <span className="spacer" />
        <button className="btn danger sm" onClick={() => { if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); return; } onDelete(); }}>{arm ? 'לחצו שוב למחיקה' : 'מחיקה'}</button>
        <button className="btn" onClick={() => onSave({ ...p, features: p.features.map((x) => x.trim()).filter(Boolean) })}>שמירה</button>
      </div>
    </div>
  );
}
