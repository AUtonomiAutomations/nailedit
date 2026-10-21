// Admin overview metrics – computed from raw rows (MetricsInput) so local demo and Supabase behave identically.
import type { Business, MetricsInput } from './db/types';
import { TRADES } from './trades';

const DAY = 86400000;
const dayKey = (d: string | number | Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

export type DayPoint = { day: number; value: number };
export type BizRow = {
  id: string; name: string; trade: string; status: Business['subscription_status']; created_at: string;
  last_sign_in_at: string | null; provider: string | null; appOpens: number; requests: number; won: number; formViews: number;
};

export function computeMetrics(m: MetricsInput, days: number) {
  const now = Date.now();
  const since = now - days * DAY;
  const inP = (d: string) => new Date(d).getTime() >= since;
  const ev = m.events.filter((e) => inP(e.created_at));
  const req = m.requests.filter((r) => inP(r.created_at));
  const planPrice = (id: string | null) => Number(m.plans.find((p) => p.id === id)?.price_monthly || 0);
  const ownerSignIn = new Map(m.signIns.map((s) => [s.user_id, s]));

  // --- businesses
  const trialing = m.businesses.filter((b) => b.subscription_status === 'trialing' && b.trial_ends_at && new Date(b.trial_ends_at).getTime() > now);
  const paying = m.businesses.filter((b) => b.subscription_status === 'active');
  const lapsed = m.businesses.filter((b) => !trialing.includes(b) && !paying.includes(b));
  const newBiz = m.businesses.filter((b) => inP(b.created_at));
  const activeIds = new Set(m.events.filter((e) => (e.type === 'app_open' || e.type === 'login') && new Date(e.created_at).getTime() >= now - 7 * DAY && e.business_id).map((e) => e.business_id!));

  // --- usage
  const count = (t: string) => ev.filter((e) => e.type === t).length;
  const appOpens = count('app_open');
  const logins = count('login');
  const formViews = count('form_view');
  const formSubmits = Math.max(req.length, count('form_submit'));
  const won = req.filter((r) => r.status === 'won');
  const wonValue = won.reduce((s, r) => s + Number(r.final_price || r.quote?.total || 0), 0);
  const quotedValue = req.reduce((s, r) => s + Number(r.quote?.total || 0), 0);

  // --- marketing funnel (unique browser sessions)
  const pv = ev.filter((e) => e.type === 'page_view');
  const sessions = (list: typeof ev) => new Set(list.map((e) => e.session_id).filter(Boolean)).size;
  const visitors = sessions(pv);
  const signupVisitors = sessions(pv.filter((e) => e.path === '/signup'));

  // --- daily series (zero-filled)
  const days0 = Array.from({ length: days }, (_, i) => dayKey(now - (days - 1 - i) * DAY));
  const series = (dates: string[]) => {
    const c = new Map<number, number>();
    for (const d of dates) c.set(dayKey(d), (c.get(dayKey(d)) || 0) + 1);
    return days0.map((day) => ({ day, value: c.get(day) || 0 }));
  };
  const uniqueByDay = (list: typeof ev) => {
    const c = new Map<number, Set<string>>();
    for (const e of list) { const k = dayKey(e.created_at); if (!c.has(k)) c.set(k, new Set()); c.get(k)!.add(e.session_id || e.created_at); }
    return days0.map((day) => ({ day, value: c.get(day)?.size || 0 }));
  };

  // --- per trade
  const byTrade = TRADES.map((t) => {
    const biz = m.businesses.filter((b) => b.trade_slug === t.slug);
    const r = req.filter((x) => x.trade_slug === t.slug);
    return {
      slug: t.slug, name: t.name,
      businesses: biz.length, newBusinesses: biz.filter((b) => inP(b.created_at)).length,
      landingViews: sessions(pv.filter((e) => e.path === `/${t.slug}`)),
      requests: r.length, won: r.filter((x) => x.status === 'won').length,
    };
  });

  // --- per business
  const bizRows: BizRow[] = m.businesses.map((b) => {
    const s = ownerSignIn.get(b.owner_id);
    const r = req.filter((x) => x.business_id === b.id);
    return {
      id: b.id, name: b.name, trade: TRADES.find((t) => t.slug === b.trade_slug)?.name || b.trade_slug,
      status: b.subscription_status, created_at: b.created_at,
      last_sign_in_at: s?.last_sign_in_at ?? null, provider: s?.provider ?? null,
      appOpens: ev.filter((e) => e.type === 'app_open' && e.business_id === b.id).length,
      formViews: ev.filter((e) => e.type === 'form_view' && e.business_id === b.id).length,
      requests: r.length, won: r.filter((x) => x.status === 'won').length,
    };
  }).sort((a, b) => (b.last_sign_in_at || '').localeCompare(a.last_sign_in_at || ''));

  const trialsEnding = trialing
    .filter((b) => new Date(b.trial_ends_at!).getTime() < now + 7 * DAY)
    .sort((a, b) => a.trial_ends_at!.localeCompare(b.trial_ends_at!));

  return {
    pros: {
      total: m.businesses.length, new: newBiz.length, trialing: trialing.length, paying: paying.length, lapsed: lapsed.length,
      active7: activeIds.size, mrr: paying.reduce((s, b) => s + planPrice(b.plan_id), 0),
      trialToPaid: m.businesses.length ? paying.length / Math.max(1, paying.length + lapsed.length) : 0,
    },
    usage: { appOpens, logins, avgOpensPerActive: activeIds.size ? appOpens / activeIds.size : 0 },
    customers: { formViews, formSubmits, conversion: formViews ? formSubmits / formViews : 0, won: won.length, wonRate: req.length ? won.length / req.length : 0, wonValue, quotedValue },
    funnel: { visitors, signupVisitors, signups: newBiz.length },
    series: {
      signups: series(newBiz.map((b) => b.created_at)),
      appOpens: series(ev.filter((e) => e.type === 'app_open').map((e) => e.created_at)),
      visitors: uniqueByDay(pv),
      requests: series(req.map((r) => r.created_at)),
    },
    byTrade, bizRows, trialsEnding,
  };
}
export type Metrics = ReturnType<typeof computeMetrics>;
