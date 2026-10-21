// Server-side search over the CBS localities + streets list (src/data/il-places.json, built by scripts/build-places.py)
import data from '@/data/il-places.json';

type Places = { cities: [number, string][]; streets: Record<string, string[]> };
const D = data as unknown as Places;

/** Normalise Hebrew for matching: drop geresh/quotes/hyphens/extra spaces, unify common spellings */
export const norm = (s: string) =>
  s.replace(/[׳'"״`־\-–().]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/קרית/g, 'קריית').replace(/^(רחוב|רח|שד|שדרות)\s+/, '').toLowerCase();

// Big cities first when several match (e.g. "תל" → תל אביב before תל שבע)
const MAJOR = ['ירושלים', 'תל אביב - יפו', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'באר שבע', 'בני ברק', 'חולון',
  'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'בית שמש', 'כפר סבא', 'הרצליה', 'חדרה', 'מודיעין-מכבים-רעות*', 'נצרת', 'לוד', 'רמלה',
  'רעננה', 'מודיעין עילית', 'ראש העין', 'הוד השרון', 'גבעתיים', 'קריית גת', 'נהריה', 'אילת', 'עפולה', 'קריית אתא', 'יבנה',
  'אום אל-פחם', 'עכו', 'אלעד', 'רמת השרון', 'כרמיאל', 'טבריה', 'נס ציונה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אונו',
  'צפת', 'קריית ים', 'אור יהודה', 'דימונה', 'נתיבות', 'שדרות', 'אופקים', 'יהוד-מונוסון', 'גבעת שמואל', 'טירת כרמל', 'מעלה אדומים'];
const MAJOR_RANK = new Map(MAJOR.map((n, i) => [norm(n.replace('*', '')), MAJOR.length - i]));
const boost = (name: string) => MAJOR_RANK.get(norm(name)) ?? 0;

function rank<T>(items: T[], name: (t: T) => string, q: string, limit: number): T[] {
  const nq = norm(q);
  if (!nq) return [];
  const starts: T[] = [], wordStarts: T[] = [], contains: T[] = [];
  for (const it of items) {
    const n = norm(name(it));
    if (n.startsWith(nq)) starts.push(it);
    else if (n.includes(' ' + nq)) wordStarts.push(it);
    else if (n.includes(nq)) contains.push(it);
  }
  const byLen = (a: T, b: T) => (boost(name(b)) - boost(name(a))) || name(a).length - name(b).length;
  return [...starts.sort(byLen), ...wordStarts.sort(byLen), ...contains.sort(byLen)].slice(0, limit);
}

export function searchCities(q: string, limit = 8) {
  return rank(D.cities, (c) => c[1], q, limit).map(([code, name]) => ({ code, name }));
}

export function searchStreets(cityCode: number, q: string, limit = 8) {
  const list = D.streets[String(cityCode)] || [];
  return rank(list, (s) => s, q, limit);
}

export function cityByName(name: string) {
  const n = norm(name);
  return D.cities.find((c) => norm(c[1]) === n) || D.cities.find((c) => norm(c[1]).startsWith(n + ' '));
}
