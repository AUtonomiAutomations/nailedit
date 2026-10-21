'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import TradeIcon from '@/components/TradeIcon';
import { TRADES, getTrade } from '@/lib/trades';
import { db } from '@/lib/db';
import { defaultPricing } from '@/lib/pricing';

function SignupInner() {
  const router = useRouter();
  const qs = useSearchParams();
  const [trade, setTrade] = useState<string>(qs.get('trade') || '');
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [needsBusinessOnly, setNeedsBusinessOnly] = useState(false);
  const [f, setF] = useState({ name: '', contact: '', phone: '', city: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const t = getTrade(trade);

  useEffect(() => {
    db().getSettings().then((s) => setTrialDays(s.trial_days)).catch(() => {});
    // signed-in user without a business (e.g. after email confirmation) → only business details
    db().getUser().then(async (u) => {
      if (!u) return;
      const b = await db().getMyBusiness();
      if (b) router.replace('/dashboard'); else setNeedsBusinessOnly(true);
    });
  }, [router]);

  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!t) return setErr('בחרו מקצוע');
    setBusy(true);
    try {
      if (!needsBusinessOnly) await db().signUp(f.email, f.password, f.contact);
      await db().createBusiness({ trade_slug: t.slug, name: f.name.trim(), contact_name: f.contact.trim(), phone: f.phone.trim(), city: f.city.trim() || null, pricing: defaultPricing(t) });
      router.push('/dashboard/pricing?welcome=1');
    } catch (e: any) { setErr(e?.message || 'ההרשמה נכשלה'); } finally { setBusy(false); }
  }

  if (!t) {
    return (
      <AuthShell>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>איזה עסק יש לך?</h1>
        <p className="muted" style={{ marginBottom: 18 }}>נתאים לך את הטופס, השאלות והמחירון.</p>
        <div className="grid g2" style={{ gap: 10 }}>
          {TRADES.map((x) => (
            <button key={x.slug} type="button" className="choice" onClick={() => setTrade(x.slug)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <span style={{ color: x.accent, display: 'inline-flex' }}><TradeIcon slug={x.slug} /></span><b>{x.pro}</b>
            </button>))}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={
      <>
        <div className="banner trial"><b>{trialDays == null ? 'תקופת ניסיון' : `${trialDays} ימי ניסיון חינם`}</b><span>בלי כרטיס אשראי</span></div>
        <div className="card stack" style={{ gap: 10 }}>
          <div className="row"><span style={{ color: t.accent, display: 'inline-flex' }}><TradeIcon slug={t.slug} size={28} /></span><h2 style={{ fontSize: 22 }}>{t.pro}</h2>
            <span className="spacer" /><button type="button" className="btn ghost sm" onClick={() => setTrade('')}>החלפה</button></div>
          <p className="muted small">אחרי ההרשמה תקבל:</p>
          <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
            <li>טופס הצעת מחיר מותאם ל{t.name}</li>
            <li>מחירון התחלתי שאפשר לשנות</li>
            <li>לינק אישי לשליחה ללקוחות</li>
            <li>לוח בקשות עם וואטסאפ וניווט</li>
          </ul>
        </div>
      </>
    }>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>פתיחת חשבון ל{t.pro}</h1>
      <p className="muted" style={{ marginBottom: 18 }}>{needsBusinessOnly ? 'עוד רגע מסיימים – פרטי העסק' : 'דקה אחת וזה מוכן'}</p>
      <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
        <div className="field"><label htmlFor="s-name">שם העסק</label><input id="s-name" type="text" required value={f.name} onChange={upd('name')} placeholder={`לדוגמה: ${t.pro === 'מובילים' ? 'הובלות המקצוענים' : 'אבי ' + t.name}`} /></div>
        <div className="form-grid">
          <div className="field"><label htmlFor="s-contact">שם איש קשר</label><input id="s-contact" type="text" required value={f.contact} onChange={upd('contact')} /></div>
          <div className="field"><label htmlFor="s-phone">טלפון (וואטסאפ)</label><input id="s-phone" type="tel" required value={f.phone} onChange={upd('phone')} placeholder="050-0000000" /></div>
        </div>
        <div className="field"><label htmlFor="s-city">אזור פעילות / עיר</label><input id="s-city" type="text" value={f.city} onChange={upd('city')} placeholder="לא חובה" /></div>
        {!needsBusinessOnly && (
          <div className="form-grid">
            <div className="field"><label htmlFor="s-email">אימייל</label><input id="s-email" type="email" required value={f.email} onChange={upd('email')} /></div>
            <div className="field"><label htmlFor="s-pass">סיסמה</label><input id="s-pass" type="password" required minLength={6} value={f.password} onChange={upd('password')} /></div>
          </div>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn accent lg block" disabled={busy}>{busy ? 'יוצרים חשבון...' : 'יצירת חשבון והתחלת ניסיון'}</button>
        <p className="small muted">כבר יש לך חשבון? <Link href="/login">כניסה</Link></p>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() { return <Suspense><SignupInner /></Suspense>; }
