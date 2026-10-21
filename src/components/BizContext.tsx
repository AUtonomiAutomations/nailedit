'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, type Business, type Plan, type SessionUser } from '@/lib/db';
import { getTrade } from '@/lib/trades';
import type { Pricing, TradeConfig } from '@/lib/trades/types';
import { normalizePricing } from '@/lib/pricing';
import { track, trackOnce } from '@/lib/track';

type Ctx = { user: SessionUser; business: Business; trade: TradeConfig; pricing: Pricing; plans: Plan[]; refresh: () => Promise<void> };
const BizCtx = createContext<Ctx | null>(null);
export const useBiz = () => useContext(BizCtx)!;

export function BizProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  // returning from Google OAuth: the URL hash still holds the token on first render
  const [fromOAuth] = useState(() => typeof window !== 'undefined' && window.location.hash.includes('access_token'));
  const load = useCallback(async () => {
    const user = await db().getUser();
    if (!user) { router.replace('/login'); return; }
    const business = await db().getMyBusiness();
    if (!business) { router.replace(user.role === 'admin' ? '/admin' : '/signup'); return; }
    const trade = getTrade(business.trade_slug)!;
    const plans = await db().listPlans(true);
    if (fromOAuth) track({ type: 'login', user_id: user.id, business_id: business.id, trade_slug: business.trade_slug });
    trackOnce('app_open', { type: 'app_open', user_id: user.id, business_id: business.id, trade_slug: business.trade_slug });
    setCtx({ user, business, trade, pricing: normalizePricing(trade, business.pricing), plans, refresh: load });
  }, [router, fromOAuth]);
  useEffect(() => { load(); }, [load]);
  if (!ctx) return <div className="empty">טוען…</div>;
  return <BizCtx.Provider value={ctx}>{children}</BizCtx.Provider>;
}
