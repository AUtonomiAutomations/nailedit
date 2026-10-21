'use client';
import { db, type AppEvent } from './db';

const SID = 'ni_sid';
function sessionId() {
  try {
    let s = sessionStorage.getItem(SID);
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(SID, s); }
    return s;
  } catch { return null; }
}

/** Fire-and-forget analytics event. Never throws. */
export function track(e: AppEvent) {
  if (typeof window === 'undefined') return;
  const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer.slice(0, 300) : null;
  db().track({ path: window.location.pathname, session_id: sessionId(), referrer: ref, ...e }).catch(() => {});
}

/** Track once per browser session per key (e.g. dashboard open) */
export function trackOnce(key: string, e: AppEvent) {
  try { if (sessionStorage.getItem('ni_once_' + key)) return; sessionStorage.setItem('ni_once_' + key, '1'); } catch { /* still track */ }
  track(e);
}
