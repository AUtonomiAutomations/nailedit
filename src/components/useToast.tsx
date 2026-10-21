'use client';
import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((m: string) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2200); }, []);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return { show, node };
}
