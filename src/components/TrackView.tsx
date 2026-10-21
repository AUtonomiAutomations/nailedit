'use client';
import { useEffect } from 'react';
import { track } from '@/lib/track';

/** Drop into a server-rendered page to record a page_view */
export default function TrackView({ trade }: { trade?: string }) {
  useEffect(() => { track({ type: 'page_view', trade_slug: trade ?? null }); }, [trade]);
  return null;
}
