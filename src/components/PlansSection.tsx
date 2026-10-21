'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db, type Plan } from '@/lib/db';

/** Plans + trial length come from the DB (admin-editable), so this renders client-side. */
export default function PlansSection({ trade }: { trade?: string }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [trialPlan, setTrialPlan] = useState<string | null>(null);
  useEffect(() => {
    db().listPlans().then(setPlans).catch(() => setPlans([]));
    db().getSettings().then((s) => { setTrialDays(s.trial_days); setTrialPlan(s.trial_plan_id); }).catch(() => {});
  }, []);
  const href = `/signup${trade ? `?trade=${trade}` : ''}`;
  const trialName = plans?.find((p) => p.id === trialPlan)?.name;

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="banner trial" style={{ justifyContent: 'center', fontSize: 16 }}>
        <b>{trialDays == null ? 'תקופת ניסיון חינם' : trialDays > 0 ? `${trialDays} ימי ניסיון חינם` : 'מתחילים מיד'}</b>
        {trialDays ? <span>{trialName ? `עם כל האפשרויות של מסלול ${trialName}` : 'עם כל האפשרויות'} · בלי כרטיס אשראי · מבטלים מתי שרוצים</span> : null}
      </div>
      <div className="grid g3">
        {(plans ?? []).map((p) => (
          <div key={p.id} className={`plan${p.id === trialPlan ? ' featured' : ''}`}>
            <div className="row"><h3 style={{ fontSize: 22 }}>{p.name}</h3>{p.id === trialPlan && <span className="pill st-trialing">הכי פופולרי</span>}</div>
            <div><span className="price">₪{p.price_monthly}</span> <span className="muted">לחודש + מע״מ</span></div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <Link href={`${href}${href.includes('?') ? '&' : '?'}plan=${p.id}`} className={`btn ${p.id === trialPlan ? 'accent' : 'ghost'} block`} style={{ marginTop: 'auto' }}>
              {trialDays ? 'מתחילים בחינם' : 'הצטרפות'}
            </Link>
          </div>
        ))}
        {plans === null && [0, 1, 2].map((i) => <div key={i} className="plan" style={{ minHeight: 320 }} aria-hidden />)}
      </div>
    </div>
  );
}
