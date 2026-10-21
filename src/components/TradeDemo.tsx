'use client';
import QuoteForm from './QuoteForm';
import { getTrade } from '@/lib/trades';
import { defaultPricing } from '@/lib/pricing';

/** Interactive preview of the customer form on a trade landing page (default prices, nothing is saved). */
export default function TradeDemo({ slug, businessName }: { slug: string; businessName: string }) {
  const t = getTrade(slug)!;
  return <QuoteForm trade={t} pricing={defaultPricing(t)} businessName={businessName} demo />;
}
