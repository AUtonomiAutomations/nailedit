'use client';
import { useEffect, useId, useRef, useState } from 'react';

type Opt = { label: string; value: string; code?: number };

/** Accessible combobox: type → suggestions from fetcher, ↑↓ to move, Enter to pick, Esc to close. Free text stays allowed. */
function Combo({ id, value, onText, onPick, fetcher, placeholder, required, disabled, inputMode }: {
  id: string; value: string; onText: (v: string) => void; onPick: (o: Opt) => void;
  fetcher: (q: string) => Promise<Opt[]>; placeholder?: string; required?: boolean; disabled?: boolean; inputMode?: 'text' | 'numeric';
}) {
  const [opts, setOpts] = useState<Opt[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const seq = useRef(0);
  const listId = useId();

  function query(v: string) {
    clearTimeout(timer.current);
    if (v.trim().length < 1) { setOpts([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const my = ++seq.current;
      try {
        const r = await fetcher(v);
        if (my === seq.current) { setOpts(r); setOpen(r.length > 0); setActive(-1); }
      } catch { /* offline – free text still works */ }
    }, 120);
  }
  const pick = (o: Opt) => { onPick(o); setOpen(false); setOpts([]); };

  return (
    <div className="combo">
      <input id={id} type="text" value={value} placeholder={placeholder} required={required} disabled={disabled} inputMode={inputMode}
        autoComplete="off" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { onText(e.target.value); query(e.target.value); }}
        onFocus={() => { if (opts.length) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(opts.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(opts[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }} />
      {open && (
        <ul className="combo-list" role="listbox" id={listId}>
          {opts.map((o, i) => (
            <li key={o.value + i} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}>{o.label}</li>))}
        </ul>)}
    </div>
  );
}

const api = async (qs: string) => (await fetch(`/api/places?${qs}`)).json();

/** Parse "הרצל 12, תל אביב" → parts (best effort, for prefilled/demo values) */
function parse(v: string) {
  const i = v.lastIndexOf(',');
  const city = i >= 0 ? v.slice(i + 1).trim() : '';
  const left = (i >= 0 ? v.slice(0, i) : v).trim();
  const m = left.match(/^(.*?)\s+(\d+[א-ת]?(?:\/\d+)?)$/);
  return { city, street: m ? m[1] : left, num: m ? m[2] : '' };
}
export const composeAddress = (street: string, num: string, city: string) =>
  [[street.trim(), num.trim()].filter(Boolean).join(' '), city.trim()].filter(Boolean).join(', ');

/** City → street → number with autocomplete from the official CBS lists. Emits one string: "רחוב מספר, עיר". */
export default function AddressField({ id, label, value, onChange, required }: {
  id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [p, setP] = useState(() => parse(value || ''));
  const [cityCode, setCityCode] = useState<number | undefined>();
  // keep in sync if the parent resets the value
  useEffect(() => { if (value !== composeAddress(p.street, p.num, p.city)) setP(parse(value || '')); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value]);
  const upd = (n: Partial<typeof p>) => { const x = { ...p, ...n }; setP(x); onChange(composeAddress(x.street, x.num, x.city)); };

  return (
    <fieldset className="field full addr">
      <legend className="label">{label}</legend>
      <div className="addr-grid">
        <div className="field">
          <label htmlFor={`${id}-city`} className="hint">עיר / יישוב</label>
          <Combo id={`${id}-city`} value={p.city} required={required} placeholder="התחילו להקליד…"
            onText={(v) => { setCityCode(undefined); upd({ city: v }); }}
            onPick={(o) => { setCityCode(o.code); upd(o.value === p.city ? { city: o.value } : { city: o.value, street: '', num: '' }); document.getElementById(`${id}-street`)?.focus(); }}
            fetcher={async (q) => (await api(`type=city&q=${encodeURIComponent(q)}`)).map((c: any) => ({ label: c.name, value: c.name, code: c.code }))} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-street`} className="hint">רחוב</label>
          <Combo id={`${id}-street`} value={p.street} required={required} placeholder={p.city ? 'התחילו להקליד…' : 'קודם בחרו עיר'}
            onText={(v) => upd({ street: v })}
            onPick={(o) => { upd({ street: o.value }); document.getElementById(`${id}-num`)?.focus(); }}
            fetcher={async (q) => {
              if (!p.city) return [];
              const qs = cityCode ? `city=${cityCode}` : `cityName=${encodeURIComponent(p.city)}`;
              return (await api(`type=street&${qs}&q=${encodeURIComponent(q)}`)).map((s: string) => ({ label: s, value: s }));
            }} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-num`} className="hint">מספר</label>
          <input id={`${id}-num`} type="text" inputMode="numeric" value={p.num} onChange={(e) => upd({ num: e.target.value })} />
        </div>
      </div>
    </fieldset>
  );
}
