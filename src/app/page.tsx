import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import TradeIcon from '@/components/TradeIcon';
import QuoteTicket from '@/components/QuoteTicket';
import PlansSection from '@/components/PlansSection';
import TrialText from '@/components/TrialText';
import TrackView from '@/components/TrackView';
import { TRADES, TRADE_MAP } from '@/lib/trades';
import { buildQuote, defaultPricing } from '@/lib/pricing';

const FEATURES = [
  { t: 'מחיר לפי המחירון שלך', d: 'אתה קובע דמי קריאה, מחיר לכל עבודה, תוספות ומינימום. המערכת מגיעה עם מחירון התחלתי לכל מקצוע.' },
  { t: 'תוספת דחוף, לילה ושבת', d: 'הלקוח מסמן כמה דחוף, והתוספת שקבעת נכנסת להצעה. בלי מבוכה ובלי ויכוח בדלת.' },
  { t: 'שאלות שמתאימות למקצוע', d: 'מובילים שואלים על קומות ומעלית, אינסטלטורים על סוג התקלה, צבעים על חדרים ותקרות.' },
  { t: 'לוח בקשות מסודר', d: 'כל ליד במקום אחד: חדש, נשלחה הצעה, נסגר. רואים כמה סגרת החודש ובכמה.' },
  { t: 'וואטסאפ בלחיצה', d: 'הלינק נשלח ללקוח בוואטסאפ, וההצעה הסופית חוזרת אליו בוואטסאפ – עם הודעה מוכנה.' },
  { t: 'ניווט ישר לכתובת', d: 'כפתור Waze לכל בקשה. למובילים – גם מסלול מלא עם עצירה באיסוף.' },
];

const FAQ = [
  { q: 'צריך להתקין משהו?', a: 'לא. נרשמים, מקבלים לינק אישי, ושולחים אותו ללקוחות בוואטסאפ, בגוגל העסקי, באינסטגרם או באתר. הכל עובד מהטלפון.' },
  { q: 'הלקוח חייב להירשם?', a: 'לא. הלקוח רק פותח את הלינק, ממלא דקה וחצי ומקבל הצעה. אין הרשמה ואין אפליקציה.' },
  { q: 'ההצעה מחייבת אותי?', a: 'לא. ההצעה מוצגת ללקוח כהערכה. אתה רואה את הבקשה, קובע מחיר סופי ושולח אותו ללקוח.' },
  { q: 'מה קורה אחרי תקופת הניסיון?', a: 'בוחרים מסלול ומשלמים חודשי. אפשר לבטל בכל רגע, בלי התחייבות.' },
  { q: 'המקצוע שלי לא ברשימה', a: 'כתבו לנו. אנחנו מוסיפים מקצועות לפי ביקוש, וכל מקצוע מקבל שאלות ומחירון משלו.' },
];

export default function Home() {
  const plumber = TRADE_MAP.plumbers;
  const sample = buildQuote(plumber, plumber.sampleAnswers, defaultPricing(plumber), null);

  return (
    <>
      <SiteHeader />
      <TrackView />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="stack" style={{ gap: 22 }}>
              <span className="eyebrow">לבעלי מקצוע שעובדים מעכשיו לעכשיו</span>
              <h1>הלקוח שואל &quot;כמה זה עולה?&quot;. <em>המערכת עונה.</em> אתה מגיע לעבוד.</h1>
              <p className="lead">
                שולחים ללקוח לינק. הוא מסמן מה צריך – תקלה, חדרים, קומה, כמה דחוף – ומקבל תוך דקה הצעת מחיר משוערת לפי התעריפים שלך.
                אצלך מופיע ליד מסודר, עם מחיר, כתובת וכפתור וואטסאפ.
              </p>
              <div className="row">
                <Link href="#trades" className="btn accent lg">בחרו את המקצוע שלכם</Link>
                <Link href="#how" className="btn ghost lg">איך זה עובד</Link>
              </div>
              <p className="small muted"><TrialText kind="short" /> · בלי כרטיס אשראי · מוכן לעבודה תוך 5 דקות</p>
            </div>
            <div className="phone" aria-label="דוגמה למה שהלקוח רואה">
              <div className="phone-screen">
                <div className="row" style={{ justifyContent: 'center', gap: 8 }}><b>אבי אינסטלציה 24/7</b></div>
                <div className="mini-field"><span>סוג העבודה</span><b>סתימה באסלה</b></div>
                <div className="mini-field"><span>כמה דחוף</span><b>עכשיו</b></div>
                <div className="mini-field"><span>כתובת</span><b>סוקולוב 8, הרצליה</b></div>
                <QuoteTicket quote={sample} title="הצעת המחיר שלך" />
              </div>
            </div>
          </div>
        </section>

        {/* PAIN */}
        <section className="band surface">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">הבעיה</span>
              <h2>כל שיחת &quot;רק רציתי לדעת בערך&quot; עולה לך כסף</h2>
              <p>אתה באמצע עבודה, הטלפון מצלצל. עוד לקוח שרוצה מחיר. חצי מהם לא יזמינו, ואת הזמן הזה אף אחד לא משלם לך.</p>
            </div>
            <div className="grid g3">
              <div className="pain"><h3>שיחות במקום עבודה</h3><p className="muted">10–20 שיחות ביום על מחיר. כל אחת 5 דקות. זה שעה וחצי ביום.</p></div>
              <div className="pain"><h3>לידים שנופלים</h3><p className="muted">לא ענית תוך רבע שעה? הלקוח כבר התקשר למתחרה. בעבודה דחופה, מי שעונה ראשון לוקח.</p></div>
              <div className="pain"><h3>הפתעות בשטח</h3><p className="muted">&quot;שכחתי להגיד שזה קומה 4 בלי מעלית&quot;. כשלא שואלים מראש, המחיר מתפוצץ ביום העבודה.</p></div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className="band steel" id="how">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">איך זה עובד</span>
              <h2>ארבעה צעדים, ופעם אחת</h2>
              <p>מגדירים פעם אחת. מאותו רגע, כל לקוח מקבל מחיר בלי שתרים טלפון.</p>
            </div>
            <ol className="flow" style={{ padding: 0, margin: 0 }}>
              <li><h3>בוחרים מקצוע ונרשמים</h3><p className="muted">המערכת מגיעה עם שאלות ומחירון שמתאימים למקצוע שלך.</p></li>
              <li><h3>מעדכנים את המחירון</h3><p className="muted">דמי קריאה, מחיר לכל עבודה, תוספת דחוף ומינימום. משנים מתי שרוצים.</p></li>
              <li><h3>שולחים את הלינק</h3><p className="muted">בוואטסאפ, בגוגל העסקי, בביו באינסטגרם או בכפתור באתר.</p></li>
              <li><h3>הלקוח מקבל מחיר, אתה מקבל ליד</h3><p className="muted">עם כל הפרטים, הכתובת והמחיר. סוגרים בוואטסאפ ויוצאים לדרך.</p></li>
            </ol>
          </div>
        </section>

        {/* TRADES */}
        <section className="band" id="trades">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">בחרו את המקצוע</span>
              <h2>איזה עסק יש לך?</h2>
              <p>לכל מקצוע יש טופס, שאלות ומחירון משלו. בחרו את שלכם וראו בדיוק מה הלקוחות שלכם יקבלו.</p>
            </div>
            <div className="grid g3">
              {TRADES.map((t) => (
                <Link key={t.slug} href={`/${t.slug}`} className="trade-card" style={{ ['--tc' as any]: t.accent }}>
                  <span className="ic"><TradeIcon slug={t.slug} size={26} /></span>
                  <h3>{t.pro}</h3>
                  <p className="muted small">{t.tagline}</p>
                  <span className="go">לעמוד של {t.pro} ←</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="band surface">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">מה מקבלים</span>
              <h2>כל מה שצריך כדי לענות מהר ולסגור יותר</h2>
            </div>
            <div className="grid g3">
              {FEATURES.map((f) => <div key={f.t} className="feature"><h3>{f.t}</h3><p className="muted">{f.d}</p></div>)}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="band" id="pricing">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">מחירים</span>
              <h2>מתחילים בחינם. משלמים רק כשזה עובד בשבילך.</h2>
              <p>עבודה אחת שנסגרה בזכות המערכת מכסה את המנוי לכמה חודשים.</p>
            </div>
            <PlansSection />
          </div>
        </section>

        {/* FAQ */}
        <section className="band surface" id="faq">
          <div className="container narrow">
            <div className="section-head"><h2>שאלות נפוצות</h2></div>
            <div className="faq">
              {FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          </div>
        </section>

        <section className="band tight cta-band">
          <div className="container row" style={{ justifyContent: 'space-between', gap: 20 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)' }}>הלקוח הבא ישאל &quot;כמה זה עולה?&quot;. תן לו תשובה עכשיו.</h2>
            <Link href="#trades" className="btn lg">בחירת מקצוע והרשמה</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
