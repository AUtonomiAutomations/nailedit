import type { PublicQuote } from '@/lib/db/types';
import { getTrade } from '@/lib/trades';
import { normalizePricing, nis } from '@/lib/pricing';
import { answerRowsBySection } from '@/lib/answers';
import { buildQuoteDoc, ils2, quoteNo } from '@/lib/quoteDoc';
import { BRAND } from '@/lib/utils';

// Always Israel time – the PDF is rendered on a UTC server
const TZ = 'Asia/Jerusalem';
const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }) : '');
const dt = (iso: string) => new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ });
const Check = () => <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden style={{ verticalAlign: '-1px', marginInlineEnd: 4 }}><path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** The A4 quote – same layout for every business; only the business block, logo and job data change. */
export default function QuoteDocument({ data }: { data: PublicQuote }) {
  const { request: r, business: b } = data;
  const trade = getTrade(r.trade_slug)!;
  const pricing = normalizePricing(trade, b.pricing);
  const doc = buildQuoteDoc(r.quote, r.discount_type, r.discount_value);
  // job details: the trade's answers minus the free-text notes and the address (shown under "לכבוד")
  const rows = answerRowsBySection(trade, r.answers, pricing);
  const no = quoteNo(r.issued_at, r.quote_number);

  return (
    <article className="qd" aria-label={`הצעת מחיר ${no}`}>
      <header className="qd-head">
        <div className="qd-biz">
          {b.logo_data && <img src={b.logo_data} alt={`לוגו ${b.name}`} className="qd-logo" />}
          <div>
            <h1 className="qd-name">{b.name}</h1>
            <div className="qd-meta">
              {b.contact_name && <span>{b.contact_name}</span>}
              <span className="num" dir="ltr">{b.phone}</span>
              {b.email && <span dir="ltr">{b.email}</span>}
              {b.city && <span>{b.city}</span>}
            </div>
          </div>
        </div>
        <div className="qd-docinfo">
          <h2>הצעת מחיר</h2>
          <dl className="num">
            <dt>מספר</dt><dd>{no}</dd>
            <dt>תאריך</dt><dd>{d(r.issued_at)}</dd>
            <dt>בתוקף עד</dt><dd>{d(r.valid_until)}</dd>
          </dl>
        </div>
      </header>

      <div className="qd-two">
        <section className="qd-box">
          <h3>לכבוד</h3>
          <p className="qd-cust">{r.customer_name}</p>
          <p className="num" dir="ltr" style={{ textAlign: 'right' }}>{r.customer_phone}</p>
          {r.address && <p>{r.address}</p>}
        </section>
        <section className="qd-box">
          <h3>פרטי העבודה – {trade.name}</h3>
          <dl className="qd-kv">
            {rows.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}
            {r.distance_km != null && <><dt>מרחק</dt><dd className="num">{Number(r.distance_km).toFixed(1)} ק״מ</dd></>}
          </dl>
        </section>
      </div>

      <table className="qd-table num">
        <thead><tr><th>#</th><th>תיאור</th><th>סכום</th></tr></thead>
        <tbody>
          {doc.lines.map((l, i) => <tr key={i}><td>{i + 1}</td><td>{l.label}</td><td dir="ltr">{nis(l.amount)}</td></tr>)}
          {doc.discount !== 0 && (
            <tr className="qd-adj"><td>{doc.lines.length + 1}</td><td>{doc.discountLabel}</td><td dir="ltr">{doc.discount > 0 ? '−' : '+'}{nis(Math.abs(doc.discount))}</td></tr>)}
        </tbody>
      </table>

      <div className="qd-totals num">
        <span>סכום לפני מע״מ</span><span dir="ltr">{ils2(doc.net)}</span>
        <span>מע״מ 18%</span><span dir="ltr">{ils2(doc.vat)}</span>
        <span className="qd-grand">סה״כ לתשלום</span><span className="qd-grand" dir="ltr">{nis(doc.gross)}</span>
      </div>

      <section className="qd-terms">
        <h3>תנאים</h3>
        <ol>
          <li>ההצעה בתוקף עד {d(r.valid_until)}.</li>
          <li>המחיר מבוסס על הפרטים שנמסרו. שינוי בהיקף העבודה או בתנאי הגישה עשוי לשנות את המחיר.</li>
          <li>לאישור ההצעה ותיאום מועד – בחתימה על ההצעה, בוואטסאפ או בטלפון <span dir="ltr">{b.phone}</span>.</li>
        </ol>
      </section>

      <div className="qd-sign">
        <div><b>{r.signer_name || r.customer_name}</b><span>שם הלקוח</span></div>
        <div>{r.signature_data ? <img src={r.signature_data} alt="חתימת הלקוח" className="qd-sigimg" /> : <i aria-hidden />}<span>חתימה</span></div>
        <div><b className="num">{d(r.signed_at || r.issued_at)}</b><span>תאריך</span></div>
      </div>
      {r.signed_at && <p className="qd-signed"><Check />ההצעה אושרה ונחתמה דיגיטלית ע״י {r.signer_name} ב-{dt(r.signed_at)}</p>}

      <footer className="qd-foot"><span>{b.name} · הצעה מס׳ {no}</span><span>הופק באמצעות {BRAND}</span></footer>
    </article>
  );
}
