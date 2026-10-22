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
  logo_data: string | null;
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
  // formal quote (0003)
  discount_type: 'percent' | 'amount' | null;
  discount_value: number | null;
  quote_token: string | null;
  quote_number: number | null;
  issued_at: string | null;
  valid_until: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signature_data: string | null;
  created_at: string;
  updated_at: string;
};

export type EventType = 'page_view' | 'form_view' | 'form_submit' | 'login' | 'app_open' | 'signup' | 'quote_view' | 'quote_signed';
export type AppEvent = {
  type: EventType;
  path?: string | null;
  trade_slug?: string | null;
  business_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  referrer?: string | null;
  created_at?: string;
};
export type SignInRow = { user_id: string; email: string; last_sign_in_at: string | null; provider: string };
/** Raw rows the admin overview is computed from (same shape from both adapters) */
export type MetricsInput = {
  businesses: Business[];
  plans: Plan[];
  requests: Pick<QuoteRequest, 'business_id' | 'trade_slug' | 'status' | 'created_at' | 'final_price' | 'quote'>[];
  events: (AppEvent & { created_at: string })[];
  signIns: SignInRow[];
};

export type PublicBusiness = Pick<Business, 'id' | 'trade_slug' | 'name' | 'phone' | 'pricing'> & { accepting: boolean };
export type SessionUser = { id: string; email: string; role: Role };

export type NewBusiness = Pick<Business, 'trade_slug' | 'name' | 'contact_name' | 'phone' | 'city' | 'pricing'>;
type QuoteFields = 'discount_type' | 'discount_value' | 'quote_token' | 'quote_number' | 'issued_at' | 'valid_until' | 'signed_at' | 'signer_name' | 'signature_data';
export type NewRequest = Omit<QuoteRequest, 'status' | 'final_price' | 'internal_notes' | 'created_at' | 'updated_at' | QuoteFields>;
export type IssueQuoteInput = Pick<QuoteRequest, 'discount_type' | 'discount_value' | 'final_price'>;
export type IssuedQuote = Pick<QuoteRequest, 'quote_token' | 'quote_number' | 'issued_at' | 'valid_until'>;
export type PublicQuote = {
  request: Pick<QuoteRequest, 'id' | 'trade_slug' | 'customer_name' | 'customer_phone' | 'address' | 'answers' | 'distance_km' | 'quote'
    | 'discount_type' | 'discount_value' | 'final_price' | 'quote_number' | 'issued_at' | 'valid_until' | 'signed_at' | 'signer_name' | 'signature_data'>;
  business: Pick<Business, 'id' | 'name' | 'contact_name' | 'phone' | 'email' | 'city' | 'logo_data' | 'trade_slug' | 'pricing'>;
};
export type BusinessPatch = Partial<Pick<Business, 'name' | 'contact_name' | 'phone' | 'city' | 'pricing' | 'logo_data'>>;
export type AdminBusinessPatch = BusinessPatch & Partial<Pick<Business, 'plan_id' | 'subscription_status' | 'trial_ends_at'>>;
export type RequestPatch = Partial<Pick<QuoteRequest, 'status' | 'final_price' | 'internal_notes'>>;

export interface Repo {
  mode: 'local' | 'supabase';
  // auth
  getUser(): Promise<SessionUser | null>;
  signUp(email: string, password: string, fullName: string): Promise<SessionUser>;
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  /** Google OAuth (Supabase only). Redirects the browser; returns only on error. */
  signInWithGoogle(nextPath: string): Promise<void>;
  // analytics
  track(e: AppEvent): Promise<void>;
  adminMetricsInput(days: number): Promise<MetricsInput>;
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
  /** Freeze the discount, assign number + token + validity. Re-issuing an unsigned quote keeps its token/number. */
  issueQuote(id: string, input: IssueQuoteInput): Promise<IssuedQuote>;
  // public quote (customer, by token)
  getPublicQuote(token: string): Promise<PublicQuote | null>;
  signQuote(token: string, signerName: string, signatureDataUrl: string): Promise<string>;
  // public (customer)
  getPublicBusiness(slug: string): Promise<PublicBusiness | null>;
  submitRequest(req: NewRequest): Promise<void>;
  // admin
  listBusinesses(): Promise<Business[]>;
  adminUpdateBusiness(id: string, patch: AdminBusinessPatch): Promise<void>;
  requestStats(): Promise<Record<string, { total: number; won: number; last30: number }>>;
}
