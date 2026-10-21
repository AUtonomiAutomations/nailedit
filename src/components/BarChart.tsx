'use client';
import { useState } from 'react';
import type { DayPoint } from '@/lib/metrics';

const fmtDay = (d: number) => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

/** Single-series daily bar chart. Thin bars, 4px rounded tops on the baseline, 2px gaps, recessive grid,
 *  per-bar hover tooltip with a hit target taller than the bar, and a table view for accessibility. */
export default function BarChart({ data, label, unit = '' }: { data: DayPoint[]; label: string; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 220, padL = 34, padR = 8, padT = 12, padB = 26;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const iw = W - padL - padR, ih = H - padT - padB;
  const bw = iw / data.length;
  const gap = Math.min(2, bw * 0.25);
  const y = (v: number) => padT + ih - (v / top) * ih;
  const every = Math.ceil(data.length / 8);
  const total = data.reduce((s, d) => s + d.value, 0);
  const h = hover != null ? data[hover] : null;

  return (
    <figure className="chart" style={{ margin: 0 }}>
      <figcaption className="row" style={{ marginBottom: 6 }}>
        <b>{label}</b><span className="muted small num">סה״כ {total.toLocaleString('he-IL')}{unit}</span>
      </figcaption>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${label} לפי יום`} style={{ display: 'block', direction: 'ltr' }}
          onMouseLeave={() => setHover(null)}>
          {Array.from({ length: top / step + 1 }, (_, i) => i * step).map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{v}</text>
            </g>))}
          {data.map((d, i) => {
            const x = padL + i * bw + gap / 2, w = Math.max(1, bw - gap), bh = y(0) - y(d.value), r = Math.min(4, w / 2, bh);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)}>
                <rect x={padL + i * bw} y={padT} width={bw} height={ih} fill="transparent" />
                {d.value > 0 && <path d={`M${x},${y(0)} V${y(d.value) + r} Q${x},${y(d.value)} ${x + r},${y(d.value)} H${x + w - r} Q${x + w},${y(d.value)} ${x + w},${y(d.value) + r} V${y(0)} Z`}
                  fill="var(--accent)" opacity={hover == null || hover === i ? 1 : 0.45} />}
                {i % every === 0 && <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{fmtDay(d.day)}</text>}
              </g>);
          })}
          <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeWidth={1} />
        </svg>
        {h && hover != null && (
          <div className="chart-tip" style={{ left: `${((padL + hover * bw + bw / 2) / W) * 100}%` }}>
            <span className="muted tiny">{fmtDay(h.day)}</span><b className="num">{h.value.toLocaleString('he-IL')}{unit}</b>
          </div>)}
      </div>
      <details className="tiny" style={{ marginTop: 6 }}>
        <summary className="muted" style={{ cursor: 'pointer' }}>הצגה כטבלה</summary>
        <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
          <table className="tbl"><thead><tr><th>תאריך</th><th>{label}</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => <tr key={d.day}><td className="num">{fmtDay(d.day)}</td><td className="num">{d.value}</td></tr>)}</tbody></table>
        </div>
      </details>
    </figure>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p);
}
