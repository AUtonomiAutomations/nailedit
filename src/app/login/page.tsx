'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { db } from '@/lib/db';
import { DEMO_ACCOUNTS } from '@/lib/db/local';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const local = db().mode === 'local';

  async function go(e?: React.FormEvent, em = email, pw = password) {
    e?.preventDefault(); setErr(''); setBusy(true);
    try {
      const u = await db().signIn(em, pw);
      router.push(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) { setErr(e?.message || 'הכניסה נכשלה'); } finally { setBusy(false); }
  }

  return (
    <AuthShell aside={local ? (
      <div className="card stack" style={{ gap: 10 }}>
        <b>מצב דמו</b>
        <p className="small muted">הנתונים נשמרים בדפדפן הזה בלבד, עד שמחברים את Supabase. אפשר להיכנס עם אחד מחשבונות הדמו:</p>
        {DEMO_ACCOUNTS.map((d) => (
          <button key={d.email} type="button" className="btn ghost block" style={{ justifyContent: 'space-between' }} onClick={() => go(undefined, d.email, d.password)}>
            <span>{d.label}</span><span className="tiny muted" style={{ direction: 'ltr' }}>{d.email}</span>
          </button>))}
      </div>) : undefined}>
      <h1 style={{ fontSize: 28, marginBottom: 18 }}>כניסה</h1>
      <form onSubmit={go} className="stack" style={{ gap: 14 }}>
        <div className="field"><label htmlFor="l-email">אימייל</label><input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="l-pass">סיסמה</label><input id="l-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn accent lg block" disabled={busy}>כניסה</button>
        <p className="small muted">אין לך חשבון? <Link href="/#trades">בחירת מקצוע והרשמה</Link></p>
      </form>
    </AuthShell>
  );
}
