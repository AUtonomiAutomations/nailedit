import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppSettings, Business, Plan, PublicBusiness, QuoteRequest, Repo, SessionUser } from './types';
import { slugify } from '../utils';

function must<T>(r: { data: T; error: any }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function supabaseRepo(url: string, anonKey: string): Repo {
  const sb: SupabaseClient = createClient(url, anonKey);

  async function currentUser(): Promise<SessionUser | null> {
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const prof = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    return { id: data.user.id, email: data.user.email || '', role: (prof.data?.role as any) || 'business' };
  }

  return {
    mode: 'supabase',
    getUser: currentUser,
    async signUp(email, password, fullName) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('נשלח אליך מייל לאימות החשבון. אחרי האימות התחבר והשלם את ההרשמה.');
      return { id: data.user!.id, email, role: 'business' };
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error('אימייל או סיסמה שגויים');
      return (await currentUser())!;
    },
    async signOut() { await sb.auth.signOut(); },

    async getSettings() {
      return must(await sb.from('app_settings').select('trial_days, trial_plan_id, updated_at').single()) as AppSettings;
    },
    async updateSettings(patch) { must(await sb.from('app_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', true)); },
    async listPlans(includeInactive) {
      let q = sb.from('plans').select('*').order('sort_order');
      if (!includeInactive) q = q.eq('is_active', true);
      return must(await q) as Plan[];
    },
    async upsertPlan(plan) { must(await sb.from('plans').upsert(plan)); },
    async deletePlan(id) { must(await sb.from('plans').delete().eq('id', id)); },

    async createBusiness(input) {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new Error('not signed in');
      return must(await sb.from('businesses').insert({ ...input, owner_id: u.user.id, email: u.user.email, public_slug: slugify(input.name, input.trade_slug) }).select().single()) as Business;
    },
    async getMyBusiness() {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return null;
      return (must(await sb.from('businesses').select('*').eq('owner_id', u.user.id).order('created_at').limit(1)) as Business[])[0] || null;
    },
    async updateMyBusiness(id, patch) { must(await sb.from('businesses').update(patch).eq('id', id)); },
    async listRequests(businessId) {
      return must(await sb.from('quote_requests').select('*').eq('business_id', businessId).order('created_at', { ascending: false })) as QuoteRequest[];
    },
    async getRequest(id) { return must(await sb.from('quote_requests').select('*').eq('id', id).maybeSingle()) as QuoteRequest | null; },
    async updateRequest(id, patch) { must(await sb.from('quote_requests').update(patch).eq('id', id)); },
    async deleteRequest(id) { must(await sb.from('quote_requests').delete().eq('id', id)); },

    async getPublicBusiness(slug) {
      const rows = must(await sb.rpc('get_public_business', { p_slug: slug })) as PublicBusiness[];
      return rows?.[0] || null;
    },
    async submitRequest(req) {
      // anon has no SELECT policy → no .select() here (no RETURNING)
      must(await sb.from('quote_requests').insert(req));
    },

    async listBusinesses() { return must(await sb.from('businesses').select('*').order('created_at', { ascending: false })) as Business[]; },
    async adminUpdateBusiness(id, patch) { must(await sb.from('businesses').update(patch).eq('id', id)); },
    async requestStats() {
      const rows = must(await sb.from('quote_requests').select('business_id, status, created_at')) as Pick<QuoteRequest, 'business_id' | 'status' | 'created_at'>[];
      const out: Record<string, { total: number; won: number; last30: number }> = {};
      const since = Date.now() - 30 * 86400000;
      for (const r of rows) {
        const s = (out[r.business_id] ||= { total: 0, won: 0, last30: 0 });
        s.total++; if (r.status === 'won') s.won++; if (new Date(r.created_at).getTime() > since) s.last30++;
      }
      return out;
    },
  };
}
