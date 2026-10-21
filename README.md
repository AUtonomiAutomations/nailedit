# NailedIt

SaaS for service businesses that work "on demand" – movers, plumbers, handymen, AC technicians, painters,
electricians, locksmiths, pest control and cleaning. A business signs up, gets a personal link, and every
customer who fills it in gets an instant estimate based on that business's price list.

## Run

```bash
npm install
npm run dev        # http://localhost:3100
```

Without Supabase env vars the app runs in **demo mode**: all data lives in the browser's localStorage
(`src/lib/db/local.ts`), seeded with demo accounts:

| Account | Email | Password |
|---|---|---|
| Platform admin | admin@nailedit.co.il | admin123 |
| Mover | movers@nailedit.co.il | 1234 |
| Plumber | plumber@nailedit.co.il | 1234 |

## Connect Supabase

1. Create a project, then run `supabase/migrations/0001_init.sql` and `supabase/seed.sql` in the SQL editor
   (or `supabase db push`).
2. Copy `.env.example` → `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Sign up through the site, then promote yourself to admin:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`

The app picks the adapter automatically (`src/lib/db/index.ts`). Both adapters implement the same `Repo`
interface (`src/lib/db/types.ts`), and the local one mirrors the SQL triggers/RLS so behaviour matches.

## Data model (Supabase)

| Table | Purpose |
|---|---|
| `app_settings` | single row: `trial_days`, `trial_plan_id` – editable in /admin |
| `plans` | subscription plans (price, lead limit, features) – editable in /admin |
| `trades` | trade catalogue (slugs must match `src/lib/trades`) |
| `profiles` | 1:1 with `auth.users`, holds `role` (`business` / `admin`) |
| `businesses` | tenants: trade, contact, `public_slug` for the customer link, `pricing` (jsonb), plan + trial |
| `quote_requests` | customer submissions: answers (jsonb), distance, computed quote (jsonb), status, final price |

Security: RLS on every table. Owners see only their business and requests; billing fields
(`plan_id`, `subscription_status`, `trial_ends_at`) can only be changed by an admin (trigger
`protect_billing_fields`); the trial window is set by trigger from `app_settings`. Customers (anon) read a
business only through `get_public_business(slug)` and may insert a request only while the business is in
an active trial or subscription.

## Pages

| Route | What |
|---|---|
| `/` | main landing page + trade picker + plans |
| `/[trade]` | landing page per trade (9), with a live interactive demo of the customer form |
| `/signup?trade=…` | sign up → business created with the trade's default price list + trial |
| `/login` | login (demo-account shortcuts in demo mode) |
| `/dashboard` | requests board · `/dashboard/requests/[id]` detail (WhatsApp, Waze, final price) |
| `/dashboard/pricing` | edit rates + price lists, live preview |
| `/dashboard/link` | personal customer link + send via WhatsApp |
| `/dashboard/account` | business details + plan / trial status |
| `/q/[slug]` | public customer form → instant estimate |
| `/admin` | businesses (status, plan, extend trial), plans editor, trial settings |

## Adding a trade

Create `src/lib/trades/<slug>.ts` exporting a `TradeConfig` (form sections, editable rates, item price
lists, `compute()` and landing copy), register it in `src/lib/trades/index.ts`, and add the slug to
`supabase/seed.sql`. The form, pricing editor, dashboard and landing page are all generated from it.

## Not built yet

- Payments (plan selection is shown but disabled; admin sets plans manually).
- Lead-limit enforcement per plan (`plans.lead_limit` is stored, not enforced).
- Team members (business plan), notifications to the business on a new request.
