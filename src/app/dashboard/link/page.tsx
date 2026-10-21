'use client';
import { useEffect, useState } from 'react';
import { useBiz } from '@/components/BizContext';
import { useToast } from '@/components/useToast';
import { waLink } from '@/lib/utils';

export default function LinkPage() {
  const { business, trade } = useBiz();
  const toast = useToast();
  const [origin, setOrigin] = useState('');
  const [phone, setPhone] = useState('');
  const [cname, setCname] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/q/${business.public_slug}`;
  const text = `היי${cname ? ' ' + cname : ''}! כאן ${business.name}.\nכדי לקבל הצעת מחיר מיד, מלאו את הטופס הקצר (דקה וחצי):\n${link}`;

  async function copy() {
    try { await navigator.clipboard.writeText(link); toast.show('הלינק הועתק'); }
    catch { (document.getElementById('lnk') as HTMLInputElement)?.select(); toast.show('סמנו והעתיקו ידנית'); }
  }

  return (
    <>
      <div className="page-title"><h1>הלינק שלי</h1></div>
      <p className="muted" style={{ marginBottom: 18, maxWidth: '65ch' }}>
        זה הטופס של {business.name}. כל מי שממלא אותו מקבל הצעת מחיר לפי המחירון שלך, והבקשה נכנסת ללוח הבקשות.
        שימו אותו בכל מקום שלקוחות מוצאים אתכם.
      </p>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="card stack" style={{ gap: 12 }}>
            <label className="label" htmlFor="lnk">לינק לטופס</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input id="lnk" type="text" readOnly value={link} style={{ direction: 'ltr', textAlign: 'left' }} />
              <button className="btn" onClick={copy}>העתקה</button>
            </div>
            <a className="btn ghost" href={`/q/${business.public_slug}`} target="_blank" rel="noopener">פתיחת הטופס כמו לקוח</a>
          </div>
          <div className="card stack" style={{ gap: 12 }}>
            <h3>שליחה ללקוח בוואטסאפ</h3>
            <div className="form-grid">
              <div className="field"><label htmlFor="cp">טלפון הלקוח</label><input id="cp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" /></div>
              <div className="field"><label htmlFor="cn">שם (לא חובה)</label><input id="cn" type="text" value={cname} onChange={(e) => setCname(e.target.value)} /></div>
            </div>
            <a className="btn wa" target="_blank" rel="noopener" href={phone ? waLink(phone, text) : undefined}
              onClick={(e) => { if (!phone) { e.preventDefault(); toast.show('הזינו טלפון של הלקוח'); } }}>שליחה בוואטסאפ</a>
          </div>
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <h3>איפה לשים את הלינק</h3>
          <ul className="stack" style={{ margin: 0, paddingInlineStart: 18, gap: 6 }}>
            <li><b>פרופיל העסק בגוגל</b> – בכפתור &quot;הזמנה&quot; או בקישור לאתר.</li>
            <li><b>וואטסאפ עסקי</b> – בהודעת הפתיחה האוטומטית ובתשובות מהירות.</li>
            <li><b>אינסטגרם / פייסבוק</b> – בקישור בביו.</li>
            <li><b>האתר שלך</b> – כפתור &quot;הצעת מחיר מיידית&quot;.</li>
            <li><b>מודעות</b> – כקישור במודעות ממומנות של {trade.name}.</li>
          </ul>
        </div>
      </div>
      {toast.node}
    </>
  );
}
