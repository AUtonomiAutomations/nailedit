const P: Record<string, string> = {
  movers: 'M2 6h12v10H2z M14 9.5h4.2l3.3 3.6V16H14 M6.5 18.5a1.8 1.8 0 1 0 0-.01 M17.5 18.5a1.8 1.8 0 1 0 0-.01',
  plumbers: 'M3 9h7v4H3z M10 10h5a4 4 0 0 1 4 4v1 M17 15h4v3h-4z M5 9V6 M8 9V6 M4 6h5',
  handyman: 'M14.5 3.5l6 6-2.5 2.5-6-6z M12 6l-8.5 8.5a1.8 1.8 0 0 0 2.5 2.5L14.5 8.5 M15 14l5 5',
  ac: 'M3 5h18v8H3z M6 10h12 M7 16v3 M12 16v4 M17 16v3',
  painters: 'M4 4h13v5H4z M17 6.5h3v6h-8v3 M11 15.5h2v5h-2z',
  electricians: 'M13 2L4.5 13.5H11L10 22l8.5-11.5H12z',
  locksmiths: 'M8 15a5 5 0 1 1 0-.01 M12 13l8-8 M17 8l2 2 M15 10l2 2',
  pest: 'M12 7a3.5 4.5 0 1 0 0 9a3.5 4.5 0 1 0 0-9 M12 7V4 M9 4l3 3 3-3 M8.5 10H4 M8.5 13l-4 2 M15.5 10H20 M15.5 13l4 2 M12 7v9',
  cleaning: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M6 18l2.5-2.5 M15.5 8.5L18 6',
};
export default function TradeIcon({ slug, size = 24 }: { slug: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[slug] || P.handyman} />
    </svg>
  );
}
