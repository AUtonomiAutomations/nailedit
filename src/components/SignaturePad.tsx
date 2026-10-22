'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type SignaturePadHandle = { toDataURL: () => string | null; clear: () => void; isEmpty: () => boolean };

/** Finger / mouse / stylus signature on a canvas. Exports a transparent PNG data URL. */
const SignaturePad = forwardRef<SignaturePadHandle, { onChange?: (empty: boolean) => void }>(function SignaturePad({ onChange }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvas.current!; const ratio = Math.max(1, window.devicePixelRatio || 1);
    const fit = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * ratio; c.height = r.height * ratio;
      const ctx = c.getContext('2d')!; ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111827';
    };
    fit();
  }, []);

  const pos = (e: React.PointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const mark = (v: boolean) => { setEmpty(v); onChange?.(v); };
  const clear = () => { const c = canvas.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); mark(true); };

  useImperativeHandle(ref, () => ({ toDataURL: () => (empty ? null : canvas.current!.toDataURL('image/png')), clear, isEmpty: () => empty }));

  return (
    <div className="sigpad">
      <canvas ref={canvas} aria-label="אזור חתימה – חתמו כאן עם האצבע או העכבר" role="img"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; last.current = pos(e); }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const ctx = canvas.current!.getContext('2d')!; const p = pos(e);
          ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          last.current = p; if (empty) mark(false);
        }}
        onPointerUp={() => { drawing.current = false; last.current = null; }}
        onPointerCancel={() => { drawing.current = false; last.current = null; }} />
      {empty && <span className="sigpad-hint" aria-hidden>חתמו כאן</span>}
      <button type="button" className="btn ghost sm sigpad-clear" onClick={clear} disabled={empty}>ניקוי</button>
    </div>
  );
});
export default SignaturePad;
