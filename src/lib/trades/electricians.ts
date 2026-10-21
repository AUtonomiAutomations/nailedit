import type { TradeConfig } from './types';
import { itemLines, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const electricians: TradeConfig = {
  slug: 'electricians',
  name: 'חשמל',
  pro: 'חשמלאים',
  proSingular: 'חשמלאי',
  tagline: 'תקלות, נקודות, תאורה ולוחות',
  accent: '#ca8a04',
  rates: [
    { key: 'callout', label: 'דמי קריאה', default: 250, unit: 'ils' },
    ...URGENCY_RATES,
    { key: 'minPrice', label: 'מחיר מינימום', default: 350, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'jobs', label: 'מחירון עבודות (ליחידה)',
      items: [
        { key: 'fault', name: 'איתור תקלה / קצר / חשמל קפץ', price: 200 },
        { key: 'outlet', name: 'הוספת נקודת חשמל (שקע)', price: 350 },
        { key: 'switch', name: 'החלפת שקע / מפסק קיים', price: 80 },
        { key: 'light', name: 'התקנת גוף תאורה / מנורה', price: 180 },
        { key: 'fan', name: 'התקנת מאוורר תקרה', price: 350 },
        { key: 'ac_point', name: 'נקודת חשמל למזגן', price: 550 },
        { key: 'oven_point', name: 'נקודה לתנור / כיריים (כוח)', price: 600 },
        { key: 'rcd', name: 'התקנת / החלפת ממסר פחת', price: 450 },
        { key: 'panel', name: 'החלפת לוח חשמל דירתי', price: 3500 },
        { key: 'ev', name: 'עמדת טעינה לרכב חשמלי', price: 2800 },
        { key: 'inspection', name: 'בדיקת תקינות מתקן', price: 700 },
      ],
    },
  ],
  sections: [
    { title: 'מה צריך?', fields: [
      { type: 'items', key: 'jobs', label: 'סמנו את העבודות וכמויות', group: 'jobs', maxQty: 30, required: true },
      { type: 'yesno', key: 'noPower', label: 'אין חשמל בכל הבית / בחלק ממנו כרגע?', default: false },
      { type: 'textarea', key: 'notes', label: 'תיאור', placeholder: 'מה קרה, איפה, מתי התחיל...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'כמה דחוף?' },
      { type: 'yesno', key: 'night', label: 'הקריאה בלילה / בשבת?', default: false },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const work = [{ label: 'דמי קריאה', amount: r(p, 'callout') }, ...itemLines(p, 'jobs', a.jobs)];
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => {
    const keys = Object.keys(a.jobs || {});
    const nm = (p.items.jobs || []).find((i) => i.key === keys[0])?.name || '';
    return (a.noPower ? 'אין חשמל · ' : '') + nm + (keys.length > 1 ? ` ועוד ${keys.length - 1}` : '');
  },
  sampleAnswers: { jobs: { outlet: 3, light: 2 }, noPower: false, urgency: 'week', night: false, address: 'הרצל 100, ראשון לציון' },
  landing: {
    headline: '"החשמל קפץ ולא חוזר" – והלקוח כבר יודע את דמי הקריאה.',
    sub: 'מתקלה דחופה ועד הוספת 3 נקודות ומנורה – הלקוח מסמן מה צריך ומקבל הערכה לפי המחירון שלך. אתה מקבל עבודה מתועדת, עם כתובת וניווט.',
    pains: [
      { title: 'שיחות באמצע עבודה', text: 'אתה על סולם עם הידיים בלוח, והטלפון מצלצל עם "כמה עולה להוסיף שקע?".' },
      { title: 'קריאות לילה בלי תוספת', text: 'כשהתוספת לא מוצגת מראש, קשה לגבות אותה בדלת.' },
      { title: 'עבודות קטנות מצטברות', text: 'לקוח מבקש "רק שקע" ובמקום מוסיף עוד 4 דברים. כאן הוא מסמן הכל מראש.' },
    ],
    howCustomer: ['רשימת עבודות עם כמויות', 'האם אין חשמל כרגע', 'כמה דחוף', 'לילה / שבת', 'כתובת'],
    scenario: 'שירן מראשון לציון צריכה 3 נקודות חשמל ו-2 גופי תאורה. היא רואה {price} ומאשרת. בלוח שלך הבקשה מסומנת "חדש", ובלחיצה אחת אתה שולח מחיר סופי ומועד.',
    faq: [
      { q: 'מה עם תקלה שלא יודעים מה היא?', a: 'הלקוח בוחר "איתור תקלה" – מוצגים דמי קריאה + אבחון, והמחיר הסופי נקבע במקום.' },
      { q: 'אפשר להוסיף עבודות למחירון?', a: 'כן, המחירון שלך לגמרי: מוסיפים, מוחקים ומשנים מחירים בכל רגע.' },
    ],
  },
};
export default electricians;
