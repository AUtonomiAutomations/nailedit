'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

let cache: number | null = null;
/** Trial length is admin-editable (app_settings.trial_days) – every marketing string about it goes through here. */
export function useTrialDays() {
  const [d, setD] = useState<number>(cache ?? 30);
  useEffect(() => { if (cache == null) db().getSettings().then((s) => { cache = s.trial_days; setD(s.trial_days); }).catch(() => {}); }, []);
  return d;
}

export function trialPhrase(days: number, kind: 'cta' | 'short' | 'heading' | 'start') {
  const month = days === 30;
  if (days <= 0) return { cta: 'הרשמה', short: 'מתחילים מיד', heading: 'מתחילים מיד', start: 'פתיחת חשבון' }[kind];
  switch (kind) {
    case 'cta': return month ? 'חודש ניסיון חינם' : `${days} ימי ניסיון חינם`;
    case 'short': return month ? 'חודש ראשון חינם' : `${days} ימים ראשונים חינם`;
    case 'heading': return month ? 'חודש ראשון עלינו' : `${days} הימים הראשונים עלינו`;
    case 'start': return month ? 'התחילו חודש ניסיון חינם' : `התחילו ${days} ימי ניסיון חינם`;
  }
}

export default function TrialText({ kind }: { kind: 'cta' | 'short' | 'heading' | 'start' }) {
  return <>{trialPhrase(useTrialDays(), kind)}</>;
}
