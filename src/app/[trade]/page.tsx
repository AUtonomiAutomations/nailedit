import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import TradeIcon from '@/components/TradeIcon';
import QuoteTicket from '@/components/QuoteTicket';
import PlansSection from '@/components/PlansSection';
import TradeDemo from '@/components/TradeDemo';
import TrialText from '@/components/TrialText';
import TrackView from '@/components/TrackView';
import { TRADES, getTrade } from '@/lib/trades';
import { buildQuote, defaultPricing, nis, rangeText } from '@/lib/pricing';
import { BRAND } from '@/lib/utils';

export function generateStaticParams() { return TRADES.map((t) => ({ trade: t.slug })); }
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { trade: string } }): Metadata {
  const t = getTrade(params.trade);
  return t ? { title: `הצעת מחיר אוטומטית ל${t.pro}`, description: t.landing.sub } : {};
}

export default function TradePage({ params }: { params: { trade: string } }) {
  const t = getTrade(params.trade);
  if (!t) notFound();
  const pricing = defaultPricing(t);
  const sample = buildQuote(t, t.sampleAnswers, pricing, t.sampleDistanceKm ?? null);
  const signup = `/signup?trade=${t.slug}`;
  const accent = { ['--tc' as any]: t.accent };
  const priceList = t.itemGroups[0]?.items.filter((i) => i.price > 0).slice(0, 6) || [];

  return (
    <>
      <SiteHeader signupHref={signup} />
      <TrackView trade={t.slug} />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="stack" style={{ gap: 22 }}>
              <Link href="/#trades" className="chip" style={{ alignSelf: 'flex-start', ...accent }}>
                <span style={{ color: t.accent, display: 'inline-flex' }}><TradeIcon slug={t.slug} size={18} /></span> {BRAND} ל{t.pro}
              </Link>
              <h1>{t.landing.headline}</h1>
              <p className="lead">{t.landing.sub}</p>
              <div className="row">
                <Link href={signup} className="btn accent lg"><TrialText kind="start" /></Link>
                <Link href="#demo" className="btn ghost lg">נסו את הטופס כמו לקוח</Link>
              </div>
              <p className="small muted">המחירון למטה הוא נקודת התחלה – אחרי ההרשמה משנים כל מחיר.</p>
            </div>
            <QuoteTicket quote={sample} title={`דוגמה – ${t.name}`} meta={t.sampleDistanceKm ? `${t.sampleDistanceKm} ק״מ` : undefined} />
          </div>
        </section>

        <section className="band surface">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">מכירים את זה?</span>
              <h2>מה שגוזל ל{t.pro} את היום</h2>
            </div>
            <div className="grid g3">
              {t.landing.pains.map((p) => <div key={p.title} className="pain"><h3>{p.title}</h3><p className="muted">{p.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="band steel">
          <div className="container grid g2" style={{ alignItems: 'start', gap: 40 }}>
            <div className="stack">
              <span className="eyebrow">מה הלקוח ממלא</span>
              <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 36px)' }}>השאלות ש{t.proSingular} היה שואל בטלפון – בטופס של דקה וחצי</h2>
              <ul className="stack" style={{ padding: 0, margin: 0, listStyle: 'none', gap: 10 }}>
                {t.landing.howCustomer.map((x) => <li key={x} className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>{x}</li>)}
              </ul>
            </div>
            <div className="stack">
              <span className="eyebrow">איך זה נראה ביום רגיל</span>
              <p style={{ fontSize: 19, lineHeight: 1.7 }}>{t.landing.scenario.replace('{price}', rangeText(sample))}</p>
            </div>
          </div>
        </section>

        <section className="band" id="demo">
          <div className="container grid g2" style={{ alignItems: 'start', gap: 40 }}>
            <div className="stack" style={{ position: 'sticky', top: 90 }}>
              <span className="eyebrow">נסו בעצמכם</span>
              <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 36px)' }}>זה הטופס שהלקוחות שלך יקבלו</h2>
              <p className="muted">שנו תשובות ותראו איך המחיר מתעדכן. המחירים כאן הם מחירון ההתחלה – אחרי ההרשמה מעדכנים לפי העסק שלכם.</p>
              {priceList.length > 0 && (
                <div className="card stack" style={{ gap: 6 }}>
                  <b>מחירון התחלתי לדוגמה</b>
                  <table className="lines"><tbody>
                    {priceList.map((i) => <tr key={i.key}><td>{i.name}</td><td>{nis(i.price)}</td></tr>)}
                  </tbody></table>
                </div>
              )}
            </div>
            <div className="demo-frame"><TradeDemo slug={t.slug} businessName={`העסק שלך ב${BRAND}`} /></div>
          </div>
        </section>

        <section className="band surface">
          <div className="container">
            <div className="section-head"><span className="eyebrow">ואצלך במערכת</span><h2>כל בקשה מגיעה מוכנה לסגירה</h2></div>
            <div className="grid g4">
              <div className="feature"><h3>לוח בקשות</h3><p className="muted">חדש, נשלחה הצעה, נסגר. הכל במקום אחד.</p></div>
              <div className="feature"><h3>פירוט החישוב</h3><p className="muted">רואים בדיוק ממה מורכב המחיר, ומעדכנים מחיר סופי.</p></div>
              <div className="feature"><h3>וואטסאפ בלחיצה</h3><p className="muted">הודעה מוכנה עם המחיר נשלחת ללקוח.</p></div>
              <div className="feature"><h3>Waze לכתובת</h3><p className="muted">יוצאים לעבודה בלחיצה אחת.</p></div>
            </div>
          </div>
        </section>

        <section className="band" id="pricing">
          <div className="container">
            <div className="section-head"><span className="eyebrow">מחירים</span><h2><TrialText kind="heading" /></h2></div>
            <PlansSection trade={t.slug} />
          </div>
        </section>

        <section className="band surface">
          <div className="container narrow">
            <div className="section-head"><h2>שאלות של {t.pro}</h2></div>
            <div className="faq">
              {t.landing.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
              <details><summary>הלקוח צריך להירשם?</summary><p>לא. הוא פותח לינק, ממלא ומקבל מחיר. בלי אפליקציה ובלי הרשמה.</p></details>
            </div>
          </div>
        </section>

        <section className="band tight cta-band" style={{ background: t.accent }}>
          <div className="container row" style={{ justifyContent: 'space-between', gap: 20 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', color: '#fff' }}>מוכנים לתת ללקוחות מחיר בלי להרים טלפון?</h2>
            <Link href={signup} className="btn lg">פתיחת חשבון ל{t.pro}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
