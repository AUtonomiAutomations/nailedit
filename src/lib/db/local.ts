// Local demo adapter – same behaviour as the Supabase schema (RLS + triggers), stored in localStorage.
// Used automatically when NEXT_PUBLIC_SUPABASE_URL is not set.
import type { AppSettings, Business, Plan, QuoteRequest, Repo, SessionUser } from './types';
import { slugify, uid } from '../utils';
import { TRADE_MAP } from '../trades';
import { buildQuote, normalizePricing } from '../pricing';

type LocalUser = { id: string; email: string; pass: string; full_name: string; role: 'business' | 'admin' };
type Store = { users: LocalUser[]; settings: AppSettings; plans: Plan[]; businesses: Business[]; requests: QuoteRequest[] };

const KEY = 'nailedit_db_v1';
const SESSION = 'nailedit_session';
const now = () => new Date().toISOString();
const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
const hash = (s: string) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'h' + (h >>> 0).toString(36); }; // demo only

export const DEMO_ACCOUNTS = [
  { email: 'admin@nailedit.co.il', password: 'admin123', label: 'מנהל מערכת' },
  { email: 'movers@nailedit.co.il', password: '1234', label: 'מוביל לדוגמה' },
  { email: 'plumber@nailedit.co.il', password: '1234', label: 'אינסטלטור לדוגמה' },
];

const DEFAULT_PLANS: Plan[] = [
  { id: 'basic', name: 'בסיסי', price_monthly: 99, lead_limit: 30, features: ['לינק אישי לטופס הצעת מחיר', 'עד 30 בקשות בחודש', 'מחשבון מחיר לפי התעריפים שלך', 'לוח בקשות'], is_active: true, sort_order: 1 },
  { id: 'pro', name: 'מקצועי', price_monthly: 199, lead_limit: null, features: ['בקשות ללא הגבלה', 'שליחת הצעה בוואטסאפ בלחיצה', 'ניווט Waze / Google Maps', 'סטטוסים ומעקב סגירות'], is_active: true, sort_order: 2 },
  { id: 'business', name: 'עסקי', price_monthly: 349, lead_limit: null, features: ['כל מה שבמקצועי', 'עד 5 משתמשים בצוות', 'דוחות הכנסות וסגירות', 'תמיכה בעדיפות'], is_active: true, sort_order: 3 },
];

function seed(): Store {
  const settings: AppSettings = { trial_days: 30, trial_plan_id: 'pro', updated_at: now() };
  const users: LocalUser[] = [
    { id: uid(), email: 'admin@nailedit.co.il', pass: hash('admin123'), full_name: 'מנהל', role: 'admin' },
    { id: uid(), email: 'movers@nailedit.co.il', pass: hash('1234'), full_name: 'יוסי כהן', role: 'business' },
    { id: uid(), email: 'plumber@nailedit.co.il', pass: hash('1234'), full_name: 'אבי לוי', role: 'business' },
  ];
  const mkBiz = (owner: LocalUser, trade: string, name: string, phone: string, slug: string, daysAgo: number): Business => ({
    id: uid(), owner_id: owner.id, trade_slug: trade, name, contact_name: owner.full_name, phone, email: owner.email, city: 'תל אביב',
    public_slug: slug, pricing: normalizePricing(TRADE_MAP[trade]), plan_id: 'pro', subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + (30 - daysAgo) * 86400000).toISOString(), created_at: ago(daysAgo), updated_at: ago(daysAgo),
  });
  const movers = mkBiz(users[1], 'movers', 'הובלות המקצוענים', '0501234567', 'demo-movers', 12);
  const plumber = mkBiz(users[2], 'plumbers', 'אבי אינסטלציה 24/7', '0529876543', 'demo-plumber', 5);

  const mkReq = (b: Business, days: number, name: string, phone: string, answers: any, km: number | null, status: QuoteRequest['status'], final: number | null = null): QuoteRequest => {
    const t = TRADE_MAP[b.trade_slug];
    const addr = answers[t.addressKey] || '';
    return {
      id: uid(), business_id: b.id, trade_slug: b.trade_slug, customer_name: name, customer_phone: phone, address: addr,
      city: addr.split(',').pop()?.trim() || null, answers, distance_km: km, distance_source: km != null ? 'osm' : null,
      quote: buildQuote(t, answers, normalizePricing(t, b.pricing), km), status, final_price: final, internal_notes: null,
      created_at: ago(days, 3), updated_at: ago(days, 3),
    };
  };
  const requests = [
    mkReq(movers, 0, 'דנה לוי', '0527654321', { pickup: 'הרצל 12, תל אביב', pickupFloor: 3, pickupElevator: false, dropoff: 'ויצמן 40, כפר סבא', dropoffFloor: 1, dropoffElevator: true, boxes: 35, furniture: { sofa3: 1, fridge: 1, washer: 1, bed2: 1, tv: 2 } }, 24.6, 'new'),
    mkReq(movers, 1, 'אבי מזרחי', '0549876543', { pickup: 'שדרות ירושלים 5, רמת גן', pickupFloor: 6, pickupElevator: true, dropoff: 'הנשיא 20, חיפה', dropoffFloor: 2, dropoffElevator: false, boxes: 60, furniture: { sofa3: 1, armchair: 2, fridge2: 1, closet3: 2 } }, 92.3, 'quoted'),
    mkReq(movers, 4, 'מיכל ברק', '0501112233', { pickup: 'סוקולוב 8, הרצליה', pickupFloor: 0, dropoff: 'אחד העם 15, רעננה', dropoffFloor: 4, dropoffElevator: true, boxes: 20, furniture: { bed1: 1, desk: 1 } }, 9.8, 'won', 1500),
    mkReq(plumber, 0, 'יוסי אברהם', '0533334444', { service: 'clog_toilet', units: 1, urgency: 'now', night: true, address: 'סוקולוב 8, הרצליה', notes: 'האסלה עולה על גדותיה' }, null, 'new'),
    mkReq(plumber, 2, 'רונית שמש', '0505556677', { service: 'heater_fix', units: 1, urgency: 'today', address: 'ביאליק 30, רמת גן' }, null, 'won', 520),
    mkReq(plumber, 3, 'עומר דהן', '0547778899', { service: 'faucet', units: 2, urgency: 'week', address: 'הרצל 100, ראשון לציון' }, null, 'quoted'),
  ];
  return { users, settings, plans: DEFAULT_PLANS, businesses: [movers, plumber], requests };
}

const safe = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export function localRepo(): Repo {
  const load = (): Store => {
    try { const s = safe.get(KEY); if (s) return JSON.parse(s); } catch { /* reseed */ }
    const s = seed(); safe.set(KEY, JSON.stringify(s)); return s;
  };
  const save = (s: Store) => safe.set(KEY, JSON.stringify(s));
  const me = (s: Store) => s.users.find((u) => u.id === safe.get(SESSION)) || null;
  const toSession = (u: LocalUser): SessionUser => ({ id: u.id, email: u.email, role: u.role });
  const requireAdmin = (s: Store) => { if (me(s)?.role !== 'admin') throw new Error('אין הרשאה'); };
  const ownsRequest = (s: Store, reqId: string) => {
    const u = me(s); const r = s.requests.find((x) => x.id === reqId);
    const b = r && s.businesses.find((x) => x.id === r.business_id);
    return r && u && (u.role === 'admin' || b?.owner_id === u.id) ? r : null;
  };
  const accepting = (b: Business) => b.subscription_status === 'active' || (b.subscription_status === 'trialing' && !!b.trial_ends_at && new Date(b.trial_ends_at) > new Date());

  return {
    mode: 'local',
    async getUser() { const u = me(load()); return u ? toSession(u) : null; },
    async signUp(email, password, fullName) {
      const s = load(); email = email.trim().toLowerCase();
      if (s.users.some((u) => u.email === email)) throw new Error('האימייל כבר רשום. נסו להתחבר.');
      const u: LocalUser = { id: uid(), email, pass: hash(password), full_name: fullName, role: 'business' };
      s.users.push(u); save(s); safe.set(SESSION, u.id); return toSession(u);
    },
    async signIn(email, password) {
      const s = load(); const u = s.users.find((x) => x.email === email.trim().toLowerCase() && x.pass === hash(password));
      if (!u) throw new Error('אימייל או סיסמה שגויים'); safe.set(SESSION, u.id); return toSession(u);
    },
    async signOut() { safe.del(SESSION); },

    async getSettings() { return load().settings; },
    async updateSettings(patch) { const s = load(); requireAdmin(s); s.settings = { ...s.settings, ...patch, updated_at: now() }; save(s); },
    async listPlans(includeInactive) { return load().plans.filter((p) => includeInactive || p.is_active).sort((a, b) => a.sort_order - b.sort_order); },
    async upsertPlan(plan) { const s = load(); requireAdmin(s); const i = s.plans.findIndex((p) => p.id === plan.id); if (i >= 0) s.plans[i] = plan; else s.plans.push(plan); save(s); },
    async deletePlan(id) { const s = load(); requireAdmin(s); s.plans = s.plans.filter((p) => p.id !== id); save(s); },

    async createBusiness(input) {
      const s = load(); const u = me(s); if (!u) throw new Error('not signed in');
      // mirrors triggers protect_billing_fields + set_business_trial
      const b: Business = {
        ...input, id: uid(), owner_id: u.id, email: u.email, public_slug: slugify(input.name, input.trade_slug),
        plan_id: s.settings.trial_plan_id, subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + s.settings.trial_days * 86400000).toISOString(), created_at: now(), updated_at: now(),
      };
      s.businesses.push(b); save(s); return b;
    },
    async getMyBusiness() { const s = load(); const u = me(s); return (u && s.businesses.find((b) => b.owner_id === u.id)) || null; },
    async updateMyBusiness(id, patch) {
      const s = load(); const u = me(s); const b = s.businesses.find((x) => x.id === id);
      if (!b || !u || (b.owner_id !== u.id && u.role !== 'admin')) throw new Error('אין הרשאה');
      const { name, contact_name, phone, city, pricing } = patch; // owners can't touch billing fields
      Object.assign(b, Object.fromEntries(Object.entries({ name, contact_name, phone, city, pricing }).filter(([, v]) => v !== undefined)), { updated_at: now() });
      save(s);
    },
    async listRequests(businessId) {
      const s = load(); const u = me(s); const b = s.businesses.find((x) => x.id === businessId);
      if (!b || !u || (b.owner_id !== u.id && u.role !== 'admin')) return [];
      return s.requests.filter((r) => r.business_id === businessId).sort((a, b2) => b2.created_at.localeCompare(a.created_at));
    },
    async getRequest(id) { return ownsRequest(load(), id); },
    async updateRequest(id, patch) { const s = load(); const r = ownsRequest(s, id); if (!r) throw new Error('אין הרשאה'); Object.assign(r, patch, { updated_at: now() }); save(s); },
    async deleteRequest(id) { const s = load(); if (!ownsRequest(s, id)) throw new Error('אין הרשאה'); s.requests = s.requests.filter((r) => r.id !== id); save(s); },

    async getPublicBusiness(slug) {
      const b = load().businesses.find((x) => x.public_slug === slug);
      return b ? { id: b.id, trade_slug: b.trade_slug, name: b.name, phone: b.phone, pricing: b.pricing, accepting: accepting(b) } : null;
    },
    async submitRequest(req) {
      const s = load(); const b = s.businesses.find((x) => x.id === req.business_id);
      if (!b || !accepting(b)) throw new Error('העסק לא מקבל בקשות כרגע');
      s.requests.push({ ...req, status: 'new', final_price: null, internal_notes: null, created_at: now(), updated_at: now() }); save(s);
    },

    async listBusinesses() { const s = load(); requireAdmin(s); return [...s.businesses].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async adminUpdateBusiness(id, patch) { const s = load(); requireAdmin(s); const b = s.businesses.find((x) => x.id === id); if (b) Object.assign(b, patch, { updated_at: now() }); save(s); },
    async requestStats() {
      const s = load(); requireAdmin(s);
      const out: Record<string, { total: number; won: number; last30: number }> = {};
      const since = Date.now() - 30 * 86400000;
      for (const r of s.requests) {
        const x = (out[r.business_id] ||= { total: 0, won: 0, last30: 0 });
        x.total++; if (r.status === 'won') x.won++; if (new Date(r.created_at).getTime() > since) x.last30++;
      }
      return out;
    },
  };
}

export function resetLocalDemo() { safe.del(KEY); safe.del(SESSION); }
