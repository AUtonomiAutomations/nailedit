'use client';
import { useEffect, useState } from 'react';
import QuoteForm, { type QuoteSubmission } from '@/components/QuoteForm';
import TradeIcon from '@/components/TradeIcon';
import { LogoMark } from '@/components/Logo';
import { db, type PublicBusiness } from '@/lib/db';
import { getTrade } from '@/lib/trades';
import { normalizePricing } from '@/lib/pricing';
import { BRAND, cityFromAddress, uid } from '@/lib/utils';
import { track } from '@/lib/track';

export default function CustomerQuotePage({ params }: { params: { slug: string } }) {
  const [biz, setBiz] = useState<PublicBusiness | null | undefined>(undefined);
  useEffect(() => {
    db().getPublicBusiness(params.slug).then((b) => {
      setBiz(b);
      if (b) track({ type: 'form_view', business_id: b.id, trade_slug: b.trade_slug });
    }).catch(() => setBiz(null));
  }, [params.slug]);

  if (biz === undefined) return <div className="empty">טוען…</div>;
  const trade = biz && getTrade(biz.trade_slug);
  if (!biz || !trade) return <main className="container narrow page"><div className="card empty">הלינק לא תקין. בקשו מבעל העסק לינק חדש.</div></main>;
  if (!biz.accepting) return <main className="container narrow page"><div className="card empty">{biz.name} לא מקבלים בקשות דרך הטופס כרגע. אפשר לפנות ישירות: <span style={{ direction: 'ltr' }}>{biz.phone}</span></div></main>;

  const pricing = normalizePricing(trade, biz.pricing);
  async function submit(s: QuoteSubmission) {
    const address = s.answers[trade!.addressKey] || '';
    await db().submitRequest({
      id: uid(), business_id: biz!.id, trade_slug: trade!.slug, customer_name: s.customer.name, customer_phone: s.customer.phone,
      address, city: cityFromAddress(address) || null, answers: s.answers, distance_km: s.distance?.km ?? null,
      distance_source: s.distance?.source ?? null, quote: s.quote,
    });
    track({ type: 'form_submit', business_id: biz!.id, trade_slug: trade!.slug });
  }

  return (
    <main className="container narrow page">
      <header className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: 8, marginBottom: 22 }}>
        <span style={{ color: trade.accent, display: 'inline-flex' }}><TradeIcon slug={trade.slug} size={34} /></span>
        <h1 style={{ fontSize: 30 }}>{biz.name}</h1>
        <p className="muted">מלאו את הפרטים וקבלו הצעת מחיר משוערת – מיד</p>
      </header>
      <QuoteForm trade={trade} pricing={pricing} businessName={biz.name} businessPhone={biz.phone} onSubmit={submit} />
      <p className="tiny muted row" style={{ justifyContent: 'center', marginTop: 28, gap: 6 }}><LogoMark size={18} /> מופעל ע״י {BRAND}</p>
    </main>
  );
}
