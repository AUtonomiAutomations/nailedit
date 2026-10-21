-- Seed data: trades + plans + default trial settings.
-- After the first admin signs up, promote them:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

insert into public.trades (slug, name, sort_order) values
  ('movers',       'הובלות',            1),
  ('plumbers',     'אינסטלציה',         2),
  ('handyman',     'הנדימן',            3),
  ('ac',           'מיזוג אוויר',       4),
  ('painters',     'צבע ושפכטל',        5),
  ('electricians', 'חשמל',              6),
  ('locksmiths',   'מנעולנות',          7),
  ('pest',         'הדברה',             8),
  ('cleaning',     'ניקיון, חלונות וספות', 9)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.plans (id, name, price_monthly, lead_limit, features, sort_order) values
  ('basic',    'בסיסי',  99,  30,   array['לינק אישי לטופס הצעת מחיר','עד 30 בקשות בחודש','מחשבון מחיר לפי התעריפים שלך','לוח בקשות'], 1),
  ('pro',      'מקצועי', 199, null, array['בקשות ללא הגבלה','שליחת הצעה בוואטסאפ בלחיצה','ניווט Waze / Google Maps','סטטוסים ומעקב סגירות'], 2),
  ('business', 'עסקי',   349, null, array['כל מה שבמקצועי','עד 5 משתמשים בצוות','דוחות הכנסות וסגירות','תמיכה בעדיפות'], 3)
on conflict (id) do update set name = excluded.name, price_monthly = excluded.price_monthly,
  lead_limit = excluded.lead_limit, features = excluded.features, sort_order = excluded.sort_order;

update public.app_settings set trial_days = 30, trial_plan_id = 'pro' where id;
