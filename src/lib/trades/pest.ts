import type { TradeConfig } from './types';
import { itemLines, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const SIZE_MULT: Record<string, number> = { small: 0.8, mid: 1, large: 1.3, house: 1.7, business: 2 };

const pest: TradeConfig = {
  slug: 'pest',
  name: 'הדברה',
  pro: 'מדבירים',
  proSingular: 'מדביר',
  tagline: 'ג׳וקים, נמלים, מכרסמים, פשפשים',
  accent: '#15803d',
  rates: [
    { key: 'visit', label: 'דמי הגעה', default: 100, unit: 'ils' },
    { key: 'followUpPct', label: 'הנחה על ריסוס חוזר / אחריות (%)', default: 0, unit: 'pct', hint: 'אם אתה כולל ביקור חוזר במחיר, השאר 0' },
    { key: 'gardenAdd', label: 'תוספת לחצר / גינה', default: 200, unit: 'ils' },
    ...URGENCY_RATES.filter((x) => x.key !== 'nightPct'),
    { key: 'minPrice', label: 'מחיר מינימום', default: 300, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'pests', label: 'מחיר בסיס לפי מזיק (לדירת 3–4 חדרים)', hint: 'המחיר מוכפל לפי גודל הנכס',
      items: [
        { key: 'roaches', name: 'ג׳וקים', price: 300 },
        { key: 'ants', name: 'נמלים', price: 280 },
        { key: 'bedbugs', name: 'פשפש המיטה', price: 900 },
        { key: 'fleas', name: 'פרעושים', price: 400 },
        { key: 'rodents', name: 'עכברים / חולדות', price: 650 },
        { key: 'termites', name: 'טרמיטים', price: 1800 },
        { key: 'mosquitoes', name: 'יתושים', price: 350 },
        { key: 'preventive', name: 'ריסוס מונע כללי', price: 250 },
      ],
    },
  ],
  sections: [
    { title: 'מה הבעיה?', fields: [
      { type: 'items', key: 'pests', label: 'סמנו את המזיקים', group: 'pests', maxQty: 1, required: true },
      { type: 'select', key: 'size', label: 'גודל הנכס', default: 'mid', options: [
        { value: 'small', label: 'דירה עד 2 חדרים' }, { value: 'mid', label: 'דירת 3–4 חדרים' }, { value: 'large', label: 'דירת 5+ חדרים' },
        { value: 'house', label: 'בית פרטי' }, { value: 'business', label: 'עסק / מסעדה / משרד' } ] },
      { type: 'yesno', key: 'garden', label: 'לטפל גם בחצר / גינה?', default: false, half: true },
      { type: 'yesno', key: 'kids', label: 'יש בבית ילדים קטנים / חיות?', default: false, half: true },
      { type: 'textarea', key: 'notes', label: 'פרטים', placeholder: 'כמה זמן זה קורה, באיזה חדרים...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'מתי?' },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const m = SIZE_MULT[a.size] ?? 1;
    const pests = itemLines(p, 'pests', a.pests).map((l) => ({ ...l, amount: l.amount * m }));
    const work = [{ label: 'דמי הגעה', amount: r(p, 'visit') }, ...pests];
    if (a.garden) work.push({ label: 'חצר / גינה', amount: r(p, 'gardenAdd') });
    if (r(p, 'followUpPct')) work.push({ label: `הנחה (${r(p, 'followUpPct')}%)`, amount: -(sum(pests) * r(p, 'followUpPct')) / 100 });
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => Object.keys(a.pests || {}).map((k) => (p.items.pests || []).find((i) => i.key === k)?.name).filter(Boolean).join(', '),
  sampleAnswers: { pests: { roaches: 1, ants: 1 }, size: 'mid', garden: true, kids: true, urgency: 'week', address: 'שדרות ירושלים 5, רמת גן' },
  landing: {
    headline: 'ג׳וק במטבח = לקוח שרוצה תשובה עכשיו.',
    sub: 'הלקוח מסמן את המזיק, גודל הנכס וחצר – ומקבל מחיר לפי המחירון שלך. מי שרואה מחיר ולוחץ "שלח" הוא לקוח שמוכן להזמין.',
    pains: [
      { title: 'אותן שאלות כל יום', text: '"כמה עולה ריסוס לג׳וקים בדירת 4 חדרים?" – 30 שניות לענות, 30 פעם ביום.' },
      { title: 'מחיר לפי גודל', text: 'קשה לתת מחיר בלי לדעת אם זו דירת 2 חדרים או מסעדה. כאן זה נשאל מראש.' },
      { title: 'בטיחות', text: 'הלקוח מסמן ילדים וחיות מראש, ואתה מגיע עם החומר המתאים.' },
    ],
    howCustomer: ['סוג המזיק (אפשר כמה)', 'גודל וסוג הנכס', 'חצר / גינה', 'ילדים או חיות בבית', 'מתי וכתובת'],
    scenario: 'משפחת לוי מרמת גן סימנה ג׳וקים ונמלים, דירת 4 חדרים עם חצר וילדים קטנים. הם רואים {price} ומבקשים מועד השבוע. אתה יודע מראש להביא חומר ידידותי.',
    faq: [
      { q: 'המחיר משתנה לפי גודל הנכס?', a: 'כן. המחיר שלך הוא לדירת 3–4 חדרים, והמערכת מתאימה אותו אוטומטית לדירה קטנה, גדולה, בית או עסק.' },
      { q: 'יש לי אחריות עם ריסוס חוזר', a: 'אפשר לציין את זה בהערות של ההצעה, או להגדיר הנחה לריסוס חוזר בתעריפים.' },
    ],
  },
};
export default pest;
