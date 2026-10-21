-- =====================================================================
-- NailedIt – initial schema
-- Multi-tenant SaaS: service businesses (movers, plumbers, ...) sign up,
-- send customers a personal link, customers get an instant estimate.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Platform settings (single row). Trial length is editable by the admin.
-- ---------------------------------------------------------------------
create table public.app_settings (
  id             boolean primary key default true check (id), -- enforces a single row
  trial_days     int     not null default 30 check (trial_days >= 0),
  trial_plan_id  text,                                      -- plan whose features apply during the trial
  updated_at     timestamptz not null default now()
);
insert into public.app_settings (id) values (true);

-- ---------------------------------------------------------------------
-- Subscription plans (editable from the admin panel)
-- ---------------------------------------------------------------------
create table public.plans (
  id             text primary key,                  -- 'basic' | 'pro' | 'business' ...
  name           text not null,
  price_monthly  numeric(10,2) not null default 0,  -- ILS, before VAT
  lead_limit     int,                                -- null = unlimited quote requests / month
  features       text[] not null default '{}',
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

alter table public.app_settings
  add constraint app_settings_trial_plan_fk foreign key (trial_plan_id) references public.plans(id) on delete set null;

-- ---------------------------------------------------------------------
-- Trades catalogue (the form + pricing *logic* lives in code: src/lib/trades)
-- ---------------------------------------------------------------------
create table public.trades (
  slug        text primary key,          -- 'movers', 'plumbers', ...
  name        text not null,             -- Hebrew display name
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------
-- Profiles: 1:1 with auth.users, holds the platform role
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'business' check (role in ('business','admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- auto-create a profile for each new auth user
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Businesses (tenants)
-- ---------------------------------------------------------------------
create table public.businesses (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  trade_slug           text not null references public.trades(slug),
  name                 text not null,
  contact_name         text,
  phone                text not null,
  email                text,
  city                 text,
  public_slug          text not null unique,                 -- used in the customer link /q/<public_slug>
  pricing              jsonb not null default '{}'::jsonb,    -- { rates: {...}, items: { groupKey: [{key,name,price}] } }
  plan_id              text references public.plans(id),
  subscription_status  text not null default 'trialing'
                         check (subscription_status in ('trialing','active','past_due','canceled','expired')),
  trial_ends_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses(owner_id);
create index businesses_trade_idx on public.businesses(trade_slug);

-- set the trial window from app_settings on insert
create or replace function public.set_business_trial() returns trigger
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  select * into s from public.app_settings limit 1;
  if new.trial_ends_at is null then
    new.trial_ends_at := now() + make_interval(days => coalesce(s.trial_days, 30));
  end if;
  if new.plan_id is null then new.plan_id := s.trial_plan_id; end if;
  return new;
end $$;
create trigger businesses_set_trial before insert on public.businesses
  for each row execute function public.set_business_trial();

-- ---------------------------------------------------------------------
-- Quote requests (submitted by end customers through the public link)
-- ---------------------------------------------------------------------
create table public.quote_requests (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  trade_slug      text not null references public.trades(slug),
  customer_name   text not null,
  customer_phone  text not null,
  address         text,              -- main service address (or pickup for movers)
  city            text,
  answers         jsonb not null default '{}'::jsonb,   -- full form answers, shape depends on trade
  distance_km     numeric(8,2),
  distance_source text,              -- google | osm | city | air | none
  quote           jsonb not null,    -- { lines:[{label,amount}], total, low, high, vatIncluded }
  status          text not null default 'new' check (status in ('new','quoted','won','lost')),
  final_price     numeric(10,2),
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index quote_requests_business_idx on public.quote_requests(business_id, created_at desc);

-- updated_at helper
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger businesses_touch before update on public.businesses for each row execute function public.touch_updated_at();
create trigger quote_requests_touch before update on public.quote_requests for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Public read of a business for the customer form – exposes only safe fields
-- ---------------------------------------------------------------------
create or replace function public.get_public_business(p_slug text)
returns table (id uuid, trade_slug text, name text, phone text, pricing jsonb, accepting boolean)
language sql stable security definer set search_path = public as $$
  select b.id, b.trade_slug, b.name, b.phone, b.pricing,
         (b.subscription_status = 'active' or (b.subscription_status = 'trialing' and b.trial_ends_at > now())) as accepting
  from public.businesses b where b.public_slug = p_slug;
$$;
grant execute on function public.get_public_business(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.app_settings   enable row level security;
alter table public.plans          enable row level security;
alter table public.trades         enable row level security;
alter table public.profiles       enable row level security;
alter table public.businesses     enable row level security;
alter table public.quote_requests enable row level security;

-- settings / plans / trades: everyone reads, only admin writes
create policy "settings read"  on public.app_settings for select using (true);
create policy "settings admin" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "plans read"     on public.plans for select using (is_active or public.is_admin());
create policy "plans admin"    on public.plans for all using (public.is_admin()) with check (public.is_admin());
create policy "trades read"    on public.trades for select using (true);
create policy "trades admin"   on public.trades for all using (public.is_admin()) with check (public.is_admin());

-- profiles: self + admin
create policy "profile self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'business');
create policy "profile admin"       on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- businesses: owner manages own; admin all. Owners cannot change billing fields (see trigger below).
create policy "business owner select" on public.businesses for select using (owner_id = auth.uid() or public.is_admin());
create policy "business owner insert" on public.businesses for insert with check (owner_id = auth.uid());
create policy "business owner update" on public.businesses for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "business admin delete" on public.businesses for delete using (public.is_admin());

create or replace function public.protect_billing_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.subscription_status := 'trialing';
      new.trial_ends_at := null;  -- recomputed by set_business_trial
      new.plan_id := null;
    else
      new.subscription_status := old.subscription_status;
      new.trial_ends_at := old.trial_ends_at;
      new.plan_id := old.plan_id;
      new.owner_id := old.owner_id;
    end if;
  end if;
  return new;
end $$;
-- runs before set_business_trial (triggers fire alphabetically)
create trigger businesses_a_protect before insert or update on public.businesses
  for each row execute function public.protect_billing_fields();

-- quote requests: anyone (anon customer) may insert for an accepting business; owner reads/updates own
create or replace function public.business_accepting(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses b where b.id = p_id and
    (b.subscription_status = 'active' or (b.subscription_status = 'trialing' and b.trial_ends_at > now())));
$$;
grant execute on function public.business_accepting(uuid) to anon, authenticated;

-- NOTE: anon has no SELECT on quote_requests, so the client inserts with a client-generated id and no RETURNING.
create policy "request public insert" on public.quote_requests for insert to anon, authenticated
  with check (public.business_accepting(business_id) and status = 'new' and final_price is null);
create policy "request owner select" on public.quote_requests for select
  using (public.is_admin() or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy "request owner update" on public.quote_requests for update
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy "request owner delete" on public.quote_requests for delete
  using (public.is_admin() or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
