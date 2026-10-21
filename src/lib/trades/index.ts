import type { TradeConfig } from './types';
import movers from './movers';
import plumbers from './plumbers';
import handyman from './handyman';
import ac from './ac';
import painters from './painters';
import electricians from './electricians';
import locksmiths from './locksmiths';
import pest from './pest';
import cleaning from './cleaning';

/** Order = order on the landing page. Keep slugs in sync with supabase/seed.sql (public.trades). */
export const TRADES: TradeConfig[] = [movers, plumbers, handyman, ac, painters, electricians, locksmiths, pest, cleaning];
export const TRADE_MAP: Record<string, TradeConfig> = Object.fromEntries(TRADES.map((t) => [t.slug, t]));
export const getTrade = (slug: string | null | undefined) => (slug ? TRADE_MAP[slug] : undefined);
export type { TradeConfig } from './types';
