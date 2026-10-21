import { NextResponse } from 'next/server';
import { cityByName, searchCities, searchStreets } from '@/lib/places';

// GET /api/places?type=city&q=תל
// GET /api/places?type=street&city=5000&q=הרצ      (city = CBS locality code, or ?cityName=)
export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || '').slice(0, 60);
  const type = u.searchParams.get('type');
  let body: unknown = [];
  if (type === 'city') body = searchCities(q);
  if (type === 'street') {
    let code = Number(u.searchParams.get('city'));
    if (!code && u.searchParams.get('cityName')) code = cityByName(u.searchParams.get('cityName')!)?.[0] ?? 0;
    body = code ? searchStreets(code, q) : [];
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
}
