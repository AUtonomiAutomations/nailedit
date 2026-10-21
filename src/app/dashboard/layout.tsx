'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { BizProvider, useBiz } from '@/components/BizContext';
import { db } from '@/lib/db';
import { daysLeft } from '@/lib/utils';

function Shell({ children }: { children: React.ReactNode }) {
  const { business, user } = useBiz();
  const path = usePathname();
  const router = useRouter();
  const tab = (href: string, label: string) => {
    const on = href === '/dashboard' ? path === '/dashboard' || path.startsWith('/dashboard/requests') : path.startsWith(href);
    return <Link href={href} className={on ? 'on' : ''}>{label}</Link>;
  };
  const left = daysLeft(business.trial_ends_at);
  const expired = business.subscription_status === 'trialing' ? left === 0 : ['expired', 'canceled', 'past_due'].includes(business.subscription_status);
  return (
    <>
      <div className="topbar"><div className="container">
        <Logo href="/dashboard" />
        <nav className="tabs">{tab('/dashboard', 'בקשות')}{tab('/dashboard/link', 'הלינק שלי')}{tab('/dashboard/pricing', 'מחירון')}{tab('/dashboard/account', 'חשבון ומנוי')}</nav>
        <span className="spacer" />
        {user.role === 'admin' && <Link href="/admin" className="btn ghost sm">ניהול מערכת</Link>}
        <span className="small muted">{business.name}</span>
        <button className="btn ghost sm" onClick={async () => { await db().signOut(); router.push('/login'); }}>יציאה</button>
      </div></div>
      <main className="container page">
        {business.subscription_status === 'trialing' && !expired && (
          <div className="banner trial" style={{ marginBottom: 18 }}>
            <b>תקופת ניסיון: נשארו {left} ימים</b><span className="spacer" /><Link href="/dashboard/account" className="btn sm accent">בחירת מסלול</Link>
          </div>)}
        {expired && (
          <div className="banner bad" style={{ marginBottom: 18 }}>
            <b>תקופת הניסיון הסתיימה – הלינק ללקוחות לא מקבל בקשות חדשות.</b><span className="spacer" /><Link href="/dashboard/account" className="btn sm">בחירת מסלול</Link>
          </div>)}
        {children}
      </main>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <BizProvider><Shell>{children}</Shell></BizProvider>;
}
