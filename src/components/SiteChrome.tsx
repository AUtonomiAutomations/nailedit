import Link from 'next/link';
import Logo from './Logo';
import { BRAND } from '@/lib/utils';
import { TRADES } from '@/lib/trades';
import TrialText from './TrialText';

export function SiteHeader({ signupHref = '/signup' }: { signupHref?: string }) {
  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        <nav>
          <Link href="/#how">איך זה עובד</Link>
          <Link href="/#trades">מקצועות</Link>
          <Link href="/#pricing">מחירים</Link>
          <Link href="/#faq">שאלות</Link>
        </nav>
        <span className="spacer" />
        <Link href="/login" className="btn ghost sm">כניסה</Link>
        <Link href={signupHref} className="btn accent sm"><TrialText kind="cta" /></Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container stack">
        <div className="chips">
          {TRADES.map((t) => <Link key={t.slug} href={`/${t.slug}`} className="chip">{t.name}</Link>)}
        </div>
        <div className="row"><span>© {new Date().getFullYear()} {BRAND}</span><span className="spacer" /><Link href="/privacy">מדיניות פרטיות</Link><Link href="/terms">תנאי שימוש</Link><Link href="/login">כניסה לבעלי עסקים</Link></div>
      </div>
    </footer>
  );
}
