-- =====================================================================
-- 0002 – product analytics events + admin helpers
-- =====================================================================

create table public.events (
  id           bigint generated always as identity primary key,
  type         text not null check (type in (
                 'page_view',    -- marketing page viewed (/, /[trade], /signup)
                 'form_view',    -- customer opened a business link (/q/<slug>)
                 'form_submit',  -- customer submitted a quote request
                 'login',        -- business owner signed in (email or Google)
                 'app_open',     -- business owner opened the dashboard (once per browser session)
                 'signup'        -- business created
               )),
  path         text,
  trade_slug   text,
  business_id  uuid references public.businesses(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  session_id   text,          -- random id per browser session (unique visitors)
  referrer     text,
  created_at   timestamptz not null default now()
);
create index events_type_time_idx on public.events(type, created_at desc);
create index events_business_idx  on public.events(business_id, created_at desc);

alter table public.events enable row level security;

-- anyone may write an event, but never on behalf of another user
create policy "events insert" on public.events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
-- only the platform admin reads them
create policy "events admin read" on public.events for select using (public.is_admin());

-- last sign-in per business owner (auth.users is not exposed to the API)
create or replace function public.admin_last_sign_ins()
returns table (user_id uuid, email text, last_sign_in_at timestamptz, provider text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select u.id, u.email::text, u.last_sign_in_at, coalesce(u.raw_app_meta_data->>'provider', 'email')
    from auth.users u;
end $$;
grant execute on function public.admin_last_sign_ins() to authenticated;
