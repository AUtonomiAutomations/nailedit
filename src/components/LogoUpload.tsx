'use client';
import { useState } from 'react';
import { db, type Business } from '@/lib/db';

/** Resize an image file to fit 400×400 and return a PNG data URL (keeps transparency, stays small). */
async function toDataUrl(file: File, max = 400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

export default function LogoUpload({ business, onSaved }: { business: Business; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function save(logo: string | null) {
    setBusy(true); setErr('');
    try { await db().updateMyBusiness(business.id, { logo_data: logo }); await onSaved(); }
    catch (e: any) { setErr(e?.message || 'השמירה נכשלה'); } finally { setBusy(false); }
  }
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <h3>לוגו העסק</h3>
      <p className="small muted">הלוגו יופיע בראש כל הצעת מחיר. מומלץ PNG עם רקע שקוף.</p>
      <div className="row" style={{ gap: 16 }}>
        <div className="logo-box">{business.logo_data ? <img src={business.logo_data} alt="הלוגו הנוכחי" /> : <span className="tiny muted">אין לוגו</span>}</div>
        <div className="stack" style={{ gap: 8 }}>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            {busy ? 'שומר…' : business.logo_data ? 'החלפת לוגו' : 'העלאת לוגו'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden disabled={busy}
              onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) return setErr('הקובץ גדול מדי (עד 5MB)');
                try { await save(await toDataUrl(f)); } catch { setErr('לא הצלחנו לקרוא את התמונה'); }
              }} />
          </label>
          {business.logo_data && <button type="button" className="btn danger sm" disabled={busy} onClick={() => save(null)}>הסרה</button>}
        </div>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
