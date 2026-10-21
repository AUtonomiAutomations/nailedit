'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, type Business, type Plan, type SessionUser } from '@/lib/db';
import { getTrade } from '@/lib/trades';
import type { Pricing, TradeConfig } from '@/lib/trades/types';
import { normalizePricing } from '@/lib/pricing';

type Ctx = { user: SessionUser; business: Business; trade: TradeConfig; pricing: Pricing; plans: Plan[]; refresh: () => Promise<void> };
const BizCtx = createContext<Ctx | null>(null);
export const useBiz = () => useContext(BizCtx)!;

export function BizProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const load = useCallback(async () => {
    const user = await db().getUser();
    if (!user) { router.replace('/login'); return; }
    const business = await db().getMyBusiness();
    if (!business) { router.replace(user.role === 'admin' ? '/admin' : '/signup'); return; }
    const trade = getTrade(business.trade_slug)!;
    const plans = await db().listPlans(true);
    setCtx({ user, business, trade, pricing: normalizePricing(trade, business.pricing), plans, refresh: load });
  }, [router]);
  useEffect(() => { load(); }, [load]);
  if (!ctx) return <div className="empty">טוען…</div>;
  return <BizCtx.Provider value={ctx}>{children}</BizCtx.Provider>;
}
