import type { TradeConfig } from './types';
import { itemOf, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const locksmiths: TradeConfig = {
  slug: 'locksmiths',
  name: 'מנעולנות',
  pro: 'מנעולנים',
  proSingular: 'מנעולן',
  tagline: 'פריצות, החלפת צילינדרים ומנעולים',
  accent: '#475569',
  rates: [
    { key: 'callout', label: 'דמי הגעה', default: 150, unit: 'ils' },
    { key: 'cylinderUnit', label: 'צילינדר נוסף (לכל אחד)', default: 180, unit: 'ils' },
    ...URGENCY_RATES,
    { key: 'minPrice', label: 'מחיר מינימום', default: 300, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'service', label: 'סוגי שירות',
      items: [
        { key: 'lockout', name: 'פריצת דלת – ננעלתי בחוץ', price: 300 },
        { key: 'lockout_multi', name: 'פריצת דלת רב-בריח / פלדלת', price: 450 },
        { key: 'cylinder', name: 'החלפת צילינדר', price: 250 },
        { key: 'cylinder_sec', name: 'החלפת צילינדר ביטחון (מוגן העתקה)', price: 450 },
        { key: 'multilock', name: 'החלפת מנגנון רב-בריח', price: 900 },
        { key: 'car', name: 'פריצת רכב', price: 350 },
        { key: 'smart', name: 'התקנת מנעול חכם', price: 650 },
        { key: 'safe', name: 'פריצת כספת', price: 700 },
      ],
    },
  ],
  sections: [
    { title: 'מה קרה?', fields: [
      { type: 'choice', key: 'service', label: 'סוג השירות', group: 'service', required: true },
      { type: 'number', key: 'extraCylinders', label: 'צילינדרים נוספים להחלפה', min: 0, max: 10, default: 0, half: true },
      { type: 'select', key: 'door', label: 'סוג הדלת', half: true, default: 'regular', options: [
        { value: 'regular', label: 'דלת רגילה' }, { value: 'steel', label: 'פלדלת / דלת ביטחון' }, { value: 'car', label: 'רכב' }, { value: 'other', label: 'אחר' } ] },
      { type: 'textarea', key: 'notes', label: 'פרטים נוספים', placeholder: 'יצרן הדלת, המפתח בפנים, ילד בבית...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'כמה דחוף?' },
      { type: 'yesno', key: 'night', label: 'בלילה / בשבת?', default: false },
      { type: 'address', key: 'address', label: 'איפה אתם? (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const it = itemOf(p, 'service', a.service);
    const work = [{ label: 'דמי הגעה', amount: r(p, 'callout') }];
    if (it) work.push({ label: it.name, amount: it.price });
    if (a.extraCylinders > 0) work.push({ label: `צילינדרים נוספים × ${a.extraCylinders}`, amount: a.extraCylinders * r(p, 'cylinderUnit') });
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => itemOf(p, 'service', a.service)?.name || '',
  sampleAnswers: { service: 'lockout', extraCylinders: 0, door: 'regular', urgency: 'now', night: true, address: 'ויצמן 40, כפר סבא' },
  landing: {
    headline: 'ננעל בחוץ בחצות? הוא רואה מחיר ולוחץ "תגיע".',
    sub: 'מנעולנות היא הכי "מעכשיו לעכשיו" שיש. הלקוח בוחר מה קרה, מסמן שזה דחוף ובלילה – ורואה מחיר שקוף לפני שאתה בכלל מניע את הרכב.',
    pains: [
      { title: 'לקוחות לחוצים שמתמקחים', text: 'בדלת, בחושך, אחרי שכבר נסעת – זה הרגע הכי גרוע לדבר על מחיר.' },
      { title: 'שמועות על "מנעולנים יקרים"', text: 'מחיר שקוף מראש בונה אמון ומבדל אותך ממי שמפתיע בסוף.' },
      { title: 'קריאות סרק', text: 'מי שראה את המחיר ולחץ "שלח" – באמת מחכה לך.' },
    ],
    howCustomer: ['מה קרה (ננעל בחוץ, החלפת צילינדר, רכב...)', 'סוג הדלת', 'צילינדרים נוספים', 'עכשיו / היום / השבוע', 'לילה או שבת', 'מיקום'],
    scenario: 'נועה ננעלה מחוץ לדירה בכפר סבא ב-23:30. היא בוחרת "פריצת דלת – דחוף – לילה" ורואה {price}. היא שולחת, ואתה מקבל את הכתובת עם כפתור Waze. בלי לדבר על מחיר.',
    faq: [
      { q: 'זה מתאים לפריצות רכב?', a: 'כן, זה סוג שירות במחירון. אפשר להוסיף גם דגמים או סוגי רכב בהערות.' },
      { q: 'אני רוצה להציג רק מחיר אחד ולא טווח', a: 'מגדירים "טווח הצעה" ל-0% והלקוח רואה מחיר אחד מדויק.' },
    ],
  },
};
export default locksmiths;
