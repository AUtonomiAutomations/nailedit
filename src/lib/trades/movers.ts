import type { TradeConfig } from './types';
import { itemLines, r, sum } from '../pricing';
import { floorLabel } from '../utils';

const movers: TradeConfig = {
  slug: 'movers',
  name: 'הובלות',
  pro: 'מובילים',
  proSingular: 'מוביל',
  tagline: 'דירות, משרדים, הובלות קטנות',
  accent: '#2f6fed',
  rates: [
    { key: 'base', label: 'מחיר בסיס (משאית + צוות)', default: 600, unit: 'ils' },
    { key: 'perKm', label: 'מחיר לק״מ', default: 6, unit: 'ils', hint: 'מרחק נסיעה מהאיסוף לפריקה' },
    { key: 'perBox', label: 'מחיר לארגז', default: 15, unit: 'ils' },
    { key: 'floorStairs', label: 'לכל קומה ללא מעלית', default: 60, unit: 'ils' },
    { key: 'floorElevator', label: 'לכל קומה עם מעלית', default: 15, unit: 'ils' },
    { key: 'assembly', label: 'פירוק והרכבה – לכל רהיט', default: 120, unit: 'ils' },
    { key: 'minPrice', label: 'מחיר מינימום להובלה', default: 900, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'furniture', label: 'פריטים גדולים', hint: 'כל פריט שהלקוח מסמן מוסיף את המחיר שלו',
      items: [
        { key: 'sofa3', name: 'ספה תלת-מושבית', price: 250 }, { key: 'sofa2', name: 'ספה דו-מושבית', price: 180 },
        { key: 'armchair', name: 'כורסה', price: 100 }, { key: 'fridge', name: 'מקרר', price: 250 },
        { key: 'fridge2', name: 'מקרר דו-דלתי / מקפיא', price: 400 }, { key: 'washer', name: 'מכונת כביסה', price: 150 },
        { key: 'dryer', name: 'מייבש כביסה', price: 120 }, { key: 'dishwasher', name: 'מדיח כלים', price: 120 },
        { key: 'oven', name: 'תנור', price: 100 }, { key: 'tv', name: 'טלוויזיה', price: 100 },
        { key: 'bed2', name: 'מיטה זוגית', price: 200 }, { key: 'bed1', name: 'מיטת יחיד', price: 100 },
        { key: 'closet2', name: 'ארון 2 דלתות', price: 200 }, { key: 'closet3', name: 'ארון 3+ דלתות', price: 350 },
        { key: 'dining', name: 'שולחן אוכל', price: 150 }, { key: 'desk', name: 'שולחן עבודה', price: 120 },
        { key: 'dresser', name: 'שידה / קומודה', price: 100 }, { key: 'piano', name: 'פסנתר', price: 800 },
      ],
    },
  ],
  sections: [
    { title: 'כתובת איסוף', fields: [
      { type: 'address', key: 'pickup', label: 'כתובת מלאה (רחוב, מספר, עיר)', required: true },
      { type: 'floor', key: 'pickupFloor', label: 'קומה', half: true },
      { type: 'yesno', key: 'pickupElevator', label: 'יש מעלית?', half: true },
    ] },
    { title: 'כתובת פריקה', fields: [
      { type: 'address', key: 'dropoff', label: 'כתובת מלאה (רחוב, מספר, עיר)', required: true },
      { type: 'floor', key: 'dropoffFloor', label: 'קומה', half: true },
      { type: 'yesno', key: 'dropoffElevator', label: 'יש מעלית?', half: true },
    ] },
    { title: 'מה מעבירים?', fields: [
      { type: 'number', key: 'boxes', label: 'כמות ארגזים (משוערת)', min: 0, step: 5, default: 0, half: true },
      { type: 'number', key: 'assemblyCount', label: 'רהיטים לפירוק והרכבה', min: 0, default: 0, half: true },
      { type: 'items', key: 'furniture', label: 'פריטים גדולים – סמנו מה יש', group: 'furniture' },
      { type: 'date', key: 'date', label: 'תאריך מבוקש', half: true },
      { type: 'textarea', key: 'notes', label: 'משהו נוסף שכדאי לדעת?', placeholder: 'חפצים שבירים, חניה רחוקה, מנוף...' },
    ] },
  ],
  addressKey: 'pickup',
  distance: { from: 'pickup', to: 'dropoff' },
  compute(a, p, { distanceKm }) {
    const lines = [{ label: 'מחיר בסיס (משאית + צוות)', amount: r(p, 'base') }];
    if (distanceKm != null) lines.push({ label: `מרחק נסיעה – ${distanceKm.toFixed(1)} ק״מ`, amount: distanceKm * r(p, 'perKm') });
    if (a.boxes > 0) lines.push({ label: `ארגזים – ${a.boxes}`, amount: a.boxes * r(p, 'perBox') });
    for (const [side, he] of [['pickup', 'איסוף'], ['dropoff', 'פריקה']] as const) {
      const f = Number(a[side + 'Floor'] || 0);
      if (!f) continue;
      const elev = !!a[side + 'Elevator'];
      lines.push({ label: `${he} – ${floorLabel(f)} ${elev ? '(עם מעלית)' : '(ללא מעלית)'}`, amount: f * r(p, elev ? 'floorElevator' : 'floorStairs') });
    }
    if (a.assemblyCount > 0) lines.push({ label: `פירוק והרכבה – ${a.assemblyCount} רהיטים`, amount: a.assemblyCount * r(p, 'assembly') });
    lines.push(...itemLines(p, 'furniture', a.furniture));
    return lines;
  },
  summary: (a) => `${a.pickup || ''} ← ${a.dropoff || ''}`,
  sampleAnswers: { pickup: 'הרצל 12, תל אביב', pickupFloor: 3, pickupElevator: false, dropoff: 'ויצמן 40, כפר סבא', dropoffFloor: 1, dropoffElevator: true, boxes: 35, furniture: { sofa3: 1, fridge: 1, washer: 1, bed2: 1 } },
  sampleDistanceKm: 24.6,
  landing: {
    headline: 'הלקוח ממלא טופס. אתה מקבל ליד עם מחיר.',
    sub: 'במקום 20 דקות בטלפון על "כמה ארגזים יש לך ובאיזו קומה", הלקוח ממלא לינק אחד ומקבל הצעה משוערת לפי התעריפים שלך – כולל מרחק, קומות ומעלית.',
    pains: [
      { title: 'שיחות שלא נגמרות', text: 'כל לקוח רוצה "רק לדעת בערך כמה". חצי מהם לא סוגרים, ואתה כבר השקעת שיחה.' },
      { title: 'הערכה בעין', text: 'שוכחים לשאול על הפסנתר בקומה 4 בלי מעלית – ומגלים את זה ביום ההובלה.' },
      { title: 'לידים בכל מקום', text: 'וואטסאפ, טלפון, פתקים. אין לך מקום אחד שבו רואים מי ביקש, כמה הצעת ומי סגר.' },
    ],
    howCustomer: ['כתובת איסוף ופריקה', 'קומה ומעלית בכל צד', 'כמות ארגזים', 'רהיטים ומכשירים גדולים', 'תאריך מבוקש'],
    scenario: 'דנה עוברת מתל אביב לכפר סבא. היא לוחצת על הלינק ששלחת לה בוואטסאפ, ממלאת תוך דקה וחצי ורואה {price}. אצלך בלוח מופיעה בקשה עם 24.6 ק״מ, קומה 3 בלי מעלית, ספה, מקרר ומכונת כביסה. כפתור אחד – והצעה סופית נשלחת אליה בוואטסאפ.',
    faq: [
      { q: 'איך מחושב המרחק?', a: 'לפי מסלול נסיעה אמיתי בין כתובת האיסוף לפריקה (Google Maps), ומוכפל במחיר לק״מ שקבעת.' },
      { q: 'אפשר לנווט לכתובות?', a: 'כן. מכל בקשה יש כפתור Waze לאיסוף ולפריקה, וכפתור למסלול מלא עם עצירה.' },
    ],
  },
};
export default movers;
