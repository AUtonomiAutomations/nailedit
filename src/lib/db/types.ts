// Row types – mirror supabase/migrations/0001_init.sql exactly.
import type { Answers, Pricing, Quote } from '../trades/types';

export type Role = 'business' | 'admin';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type RequestStatus = 'new' | 'quoted' | 'won' | 'lost';

export type AppSettings = { trial_days: number; trial_plan_id: string | null; updated_at?: string };

export type Plan = {
  id: string;
  name: string;
  price_monthly: number;
  lead_limit: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

export type Business = {
  id: string;
  owner_id: string;
  trade_slug: string;
  name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  public_slug: string;
  pricing: Partial<Pricing>;
  plan_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteRequest = {
  id: string;
  business_id: string;
  trade_slug: string;
  customer_name: string;
  customer_phone: string;
  address: string | null;
  city: string | null;
  answers: Answers;
  distance_km: number | null;
  distance_source: string | null;
  quote: Quote;
  status: RequestStatus;
  final_price: number | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicBusiness = Pick<Business, 'id' | 'trade_slug' | 'name' | 'phone' | 'pricing'> & { accepting: boolean };
export type SessionUser = { id: string; email: string; role: Role };

export type NewBusiness = Pick<Business, 'trade_slug' | 'name' | 'contact_name' | 'phone' | 'city' | 'pricing'>;
export type NewRequest = Omit<QuoteRequest, 'status' | 'final_price' | 'internal_notes' | 'created_at' | 'updated_at'>;
export type BusinessPatch = Partial<Pick<Business, 'name' | 'contact_name' | 'phone' | 'city' | 'pricing'>>;
export type AdminBusinessPatch = BusinessPatch & Partial<Pick<Business, 'plan_id' | 'subscription_status' | 'trial_ends_at'>>;
export type RequestPatch = Partial<Pick<QuoteRequest, 'status' | 'final_price' | 'internal_notes'>>;

export interface Repo {
  mode: 'local' | 'supabase';
  // auth
  getUser(): Promise<SessionUser | null>;
  signUp(email: string, password: string, fullName: string): Promise<SessionUser>;
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  // platform
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  listPlans(includeInactive?: boolean): Promise<Plan[]>;
  upsertPlan(plan: Plan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  // business owner
  createBusiness(input: NewBusiness): Promise<Business>;
  getMyBusiness(): Promise<Business | null>;
  updateMyBusiness(id: string, patch: BusinessPatch): Promise<void>;
  listRequests(businessId: string): Promise<QuoteRequest[]>;
  getRequest(id: string): Promise<QuoteRequest | null>;
  updateRequest(id: string, patch: RequestPatch): Promise<void>;
  deleteRequest(id: string): Promise<void>;
  // public (customer)
  getPublicBusiness(slug: string): Promise<PublicBusiness | null>;
  submitRequest(req: NewRequest): Promise<void>;
  // admin
  listBusinesses(): Promise<Business[]>;
  adminUpdateBusiness(id: string, patch: AdminBusinessPatch): Promise<void>;
  requestStats(): Promise<Record<string, { total: number; won: number; last30: number }>>;
}
