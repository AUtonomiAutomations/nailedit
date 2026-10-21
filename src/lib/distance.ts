// Driving distance between two Israeli addresses.
// 1) Google Distance Matrix (if NEXT_PUBLIC_GOOGLE_MAPS_KEY)  2) OpenStreetMap (Nominatim + OSRM)  3) city table × 1.3
export type DistanceResult = { km: number | null; source: 'google' | 'osm' | 'air' | 'city' | 'none' };

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

declare global { interface Window { google?: any; __gmReady?: () => void } }
let gmapsPromise: Promise<void> | null = null;
export function loadGoogle(): Promise<void> {
  if (!GOOGLE_KEY) return Promise.reject(new Error('no key'));
  if (typeof window !== 'undefined' && window.google?.maps?.places) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((res, rej) => {
    window.__gmReady = () => res();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&libraries=places&language=iw&region=IL&callback=__gmReady`;
    s.onerror = () => { gmapsPromise = null; rej(new Error('google load failed')); };
    document.head.appendChild(s);
  });
  return gmapsPromise;
}
export const hasGoogle = () => !!GOOGLE_KEY;

function googleDistance(a: string, b: string): Promise<number> {
  return new Promise((res, rej) => {
    new window.google.maps.DistanceMatrixService().getDistanceMatrix(
      { origins: [a], destinations: [b], travelMode: 'DRIVING', region: 'IL' },
      (r: any, st: string) => {
        const el = r?.rows?.[0]?.elements?.[0];
        if (st === 'OK' && el?.status === 'OK') res(el.distance.value / 1000);
        else rej(new Error(st));
      },
    );
  });
}

type LatLon = { lat: number; lon: number };
const norm = (t: string) => t.replace(/[-–־"'״\s]/g, '').replace(/קרית/g, 'קריית');

async function geocodeOSM(q: string): Promise<LatLon> {
  const u = 'https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&countrycodes=il&accept-language=he&q=' + encodeURIComponent(q);
  const j = await (await fetch(u)).json();
  if (!j[0]) throw new Error('not found');
  // OSM may match "רחובות" to "נפת רחובות" – prefer a result whose city matches the last part of the address
  const city = norm(q.split(',').pop() || '');
  const hit = (q.includes(',') && j.find((x: any) => {
    const c = norm(x.address?.city || x.address?.town || x.address?.village || '');
    return c && (c.includes(city) || city.includes(c));
  })) || j[0];
  return { lat: +hit.lat, lon: +hit.lon };
}
async function routeOSRM(p: LatLon, q: LatLon) {
  const j = await (await fetch(`https://router.project-osrm.org/route/v1/driving/${p.lon},${p.lat};${q.lon},${q.lat}?overview=false`)).json();
  if (j.code !== 'Ok') throw new Error('osrm');
  return j.routes[0].distance / 1000;
}
export function haversine(p: LatLon, q: LatLon) {
  const R = 6371, t = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(t(q.lat - p.lat) / 2) ** 2 + Math.cos(t(p.lat)) * Math.cos(t(q.lat)) * Math.sin(t(q.lon - p.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const CITIES: Record<string, [number, number]> = {
  'תל אביב': [32.0853, 34.7818], 'ירושלים': [31.7683, 35.2137], 'חיפה': [32.794, 34.9896], 'ראשון לציון': [31.973, 34.7925],
  'פתח תקווה': [32.084, 34.8878], 'פתח תקוה': [32.084, 34.8878], 'אשדוד': [31.8044, 34.6553], 'נתניה': [32.3215, 34.8532],
  'באר שבע': [31.252, 34.7915], 'בני ברק': [32.0807, 34.8338], 'חולון': [32.0158, 34.7874], 'רמת גן': [32.0684, 34.8248],
  'אשקלון': [31.6688, 34.5743], 'רחובות': [31.8928, 34.8113], 'בת ים': [32.0231, 34.7503], 'הרצליה': [32.1663, 34.8433],
  'כפר סבא': [32.175, 34.907], 'חדרה': [32.434, 34.9196], 'מודיעין': [31.898, 35.0104], 'רעננה': [32.1848, 34.8713],
  'לוד': [31.951, 34.8881], 'רמלה': [31.9293, 34.8656], 'נצרת': [32.6996, 35.3035], 'עפולה': [32.6078, 35.2897],
  'קריית גת': [31.61, 34.7642], 'אילת': [29.5577, 34.9519], 'טבריה': [32.7922, 35.5312], 'נהריה': [33.0089, 35.0981],
  'עכו': [32.9281, 35.0818], 'כרמיאל': [32.919, 35.295], 'גבעתיים': [32.0722, 34.8125], 'הוד השרון': [32.15, 34.888],
  'נס ציונה': [31.9293, 34.7987], 'ראש העין': [32.0956, 34.9566], 'יבנה': [31.8781, 34.7383], 'קריית אונו': [32.0636, 34.8553],
  'אור יהודה': [32.0306, 34.8513], 'יהוד': [32.0333, 34.8833], 'רמת השרון': [32.1461, 34.8394], 'קריית שמונה': [33.2073, 35.5704],
  'צפת': [32.9646, 35.496], 'דימונה': [31.0684, 35.0331], 'ערד': [31.2589, 35.2128], 'בית שמש': [31.747, 34.9881],
  'אלעד': [32.0522, 34.951], 'קריית ביאליק': [32.8275, 35.0858], 'קריית אתא': [32.809, 35.107], 'זכרון יעקב': [32.5707, 34.952],
  'אופקים': [31.3141, 34.6203], 'שדרות': [31.525, 34.5967], 'נתיבות': [31.4231, 34.5886], 'קיסריה': [32.5, 34.9],
  'גדרה': [31.8136, 34.7778], 'מעלה אדומים': [31.777, 35.298], 'אריאל': [32.1046, 35.1745], 'יפו': [32.0504, 34.7522],
};
function cityOf(addr: string): LatLon | null {
  const a = norm(addr);
  let best: { k: string; lat: number; lon: number } | null = null;
  for (const [n, c] of Object.entries(CITIES)) {
    const k = norm(n);
    if (a.includes(k) && (!best || k.length > best.k.length)) best = { k, lat: c[0], lon: c[1] };
  }
  return best;
}

export async function getDistance(a: string, b: string): Promise<DistanceResult> {
  if (GOOGLE_KEY) {
    try { await loadGoogle(); return { km: await googleDistance(a, b), source: 'google' }; } catch (e) { console.warn('google distance failed', e); }
  }
  try {
    const [p, q] = await Promise.all([geocodeOSM(a), geocodeOSM(b)]);
    try { return { km: await routeOSRM(p, q), source: 'osm' }; } catch { return { km: haversine(p, q) * 1.3, source: 'air' }; }
  } catch {
    const p = cityOf(a), q = cityOf(b);
    if (p && q) return { km: Math.max(haversine(p, q) * 1.3, 5), source: 'city' };
    return { km: null, source: 'none' };
  }
}

export const DISTANCE_SOURCE_LABEL: Record<string, string> = {
  google: 'מסלול נסיעה (Google)', osm: 'מסלול נסיעה', air: 'הערכה אווירית', city: 'הערכה לפי עיר', none: 'לא חושב',
};
