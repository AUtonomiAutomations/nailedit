-- =====================================================================
-- 0003 – formal quotes (discount, number, validity), customer e-signature, business logo
-- =====================================================================

-- business logo, stored as a small data URL (client resizes to ≤ 400px before upload)
alter table public.businesses add column logo_data text check (logo_data is null or length(logo_data) < 400000);

alter table public.quote_requests
  add column discount_type  text check (discount_type in ('percent', 'amount')),
  add column discount_value numeric(10,2),
  add column quote_token    text unique,          -- unguessable id used in the customer link /quote/<token>
  add column quote_number   int,                  -- per-business running number
  add column issued_at      timestamptz,
  add column valid_until    date,
  add column signed_at      timestamptz,
  add column signer_name    text,
  add column signature_data text check (signature_data is null or length(signature_data) < 300000); -- PNG data URL

-- Owners may edit their quote but never forge a signature: column-level UPDATE grants.
revoke update on public.quote_requests from anon, authenticated;
grant update (status, final_price, internal_notes, discount_type, discount_value, quote_token, quote_number, issued_at, valid_until)
  on public.quote_requests to authenticated;

-- new analytics event types
alter table public.events drop constraint events_type_check;
alter table public.events add constraint events_type_check check (type in (
  'page_view', 'form_view', 'form_submit', 'login', 'app_open', 'signup', 'quote_view', 'quote_signed'));

-- Public read of an issued quote by token (customer has no account)
create or replace function public.get_public_quote(p_token text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'request', json_build_object(
      'id', r.id, 'trade_slug', r.trade_slug, 'customer_name', r.customer_name, 'customer_phone', r.customer_phone,
      'address', r.address, 'answers', r.answers, 'distance_km', r.distance_km, 'quote', r.quote,
      'discount_type', r.discount_type, 'discount_value', r.discount_value, 'final_price', r.final_price,
      'quote_number', r.quote_number, 'issued_at', r.issued_at, 'valid_until', r.valid_until,
      'signed_at', r.signed_at, 'signer_name', r.signer_name, 'signature_data', r.signature_data),
    'business', json_build_object(
      'id', b.id, 'name', b.name, 'contact_name', b.contact_name, 'phone', b.phone, 'email', b.email,
      'city', b.city, 'logo_data', b.logo_data, 'trade_slug', b.trade_slug, 'pricing', b.pricing))
  from public.quote_requests r join public.businesses b on b.id = r.business_id
  where r.quote_token = p_token and r.issued_at is not null and length(p_token) >= 20;
$$;
grant execute on function public.get_public_quote(text) to anon, authenticated;

-- Customer signs an issued, unsigned quote → request becomes 'won'
create or replace function public.sign_quote(p_token text, p_name text, p_signature text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_biz uuid; v_trade text; v_at timestamptz := now();
begin
  if coalesce(length(trim(p_name)), 0) < 2 then raise exception 'name required'; end if;
  if p_signature is null or p_signature not like 'data:image/png;base64,%' or length(p_signature) > 300000 then
    raise exception 'invalid signature'; end if;
  update public.quote_requests
     set signed_at = v_at, signer_name = trim(p_name), signature_data = p_signature, status = 'won'
   where quote_token = p_token and issued_at is not null and signed_at is null
     and (valid_until is null or valid_until >= current_date)
  returning id, business_id, trade_slug into v_id, v_biz, v_trade;
  if v_id is null then raise exception 'quote not found, expired or already signed'; end if;
  insert into public.events (type, business_id, trade_slug) values ('quote_signed', v_biz, v_trade);
  return v_at;
end $$;
grant execute on function public.sign_quote(text, text, text) to anon, authenticated;
