import type { TradeConfig } from './types';
import { itemOf, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';
import { floorLabel } from '../utils';

const ac: TradeConfig = {
  slug: 'ac',
  name: 'מיזוג אוויר',
  pro: 'טכנאי ומתקיני מזגנים',
  proSingular: 'טכנאי מזגנים',
  tagline: 'התקנות, ניקוי, תיקונים ומילוי גז',
  accent: '#0284c7',
  rates: [
    { key: 'callout', label: 'דמי ביקור (לתיקון / אבחון)', default: 250, unit: 'ils' },
    { key: 'pipeMeter', label: 'מטר צנרת מעבר ל-3 מ׳ בהתקנה', default: 120, unit: 'ils' },
    { key: 'highFloor', label: 'תוספת עבודה בגובה / קומה 3+ בלי מרפסת', default: 250, unit: 'ils' },
    { key: 'disposal', label: 'פירוק ופינוי מזגן ישן', default: 200, unit: 'ils' },
    ...URGENCY_RATES.filter((x) => x.key !== 'nightPct'),
    { key: 'minPrice', label: 'מחיר מינימום', default: 300, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'service', label: 'סוגי שירות (מחיר ליחידה)',
      items: [
        { key: 'install_1', name: 'התקנת מזגן עילי עד 1.25 כ״ס', price: 900 },
        { key: 'install_2', name: 'התקנת מזגן עילי 1.5–2.5 כ״ס', price: 1200 },
        { key: 'install_mini', name: 'התקנת מיני מרכזי', price: 3500 },
        { key: 'clean', name: 'ניקוי וחיטוי מזגן עילי', price: 250 },
        { key: 'gas', name: 'מילוי גז', price: 450 },
        { key: 'repair', name: 'תקלה – לא מקרר / לא נדלק / נוזל', price: 0 },
        { key: 'move', name: 'העתקת מזגן (פירוק + התקנה מחדש)', price: 1100 },
      ],
    },
  ],
  sections: [
    { title: 'מה צריך?', fields: [
      { type: 'choice', key: 'service', label: 'סוג השירות', group: 'service', required: true },
      { type: 'number', key: 'units', label: 'כמה מזגנים?', min: 1, max: 10, default: 1, half: true },
      { type: 'number', key: 'pipeMeters', label: 'אורך צנרת משוער (מטר) – להתקנה', min: 0, max: 30, default: 3, half: true },
      { type: 'yesno', key: 'removeOld', label: 'צריך לפרק ולפנות מזגן ישן?', default: false, half: true },
      { type: 'floor', key: 'floor', label: 'קומה', half: true },
      { type: 'yesno', key: 'balcony', label: 'המעבה יותקן במרפסת / על הגג (גישה נוחה)?', default: true },
      { type: 'textarea', key: 'notes', label: 'פרטים נוספים', placeholder: 'דגם, שנת התקנה, מה התקלה...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'כמה דחוף?' },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const it = itemOf(p, 'service', a.service);
    const units = Math.max(1, Number(a.units || 1));
    const lines: { label: string; amount: number }[] = [];
    if (a.service === 'repair' || a.service === 'gas') lines.push({ label: 'דמי ביקור ואבחון', amount: r(p, 'callout') });
    if (it && it.price) lines.push({ label: `${it.name}${units > 1 ? ` × ${units}` : ''}`, amount: it.price * units });
    if (String(a.service || '').startsWith('install') || a.service === 'move') {
      const extra = Math.max(0, Number(a.pipeMeters || 0) - 3);
      if (extra) lines.push({ label: `צנרת נוספת – ${extra} מ׳`, amount: extra * r(p, 'pipeMeter') * units });
      if (Number(a.floor) >= 3 && !a.balcony) lines.push({ label: `עבודה בגובה – ${floorLabel(a.floor)}`, amount: r(p, 'highFloor') * units });
    }
    if (a.removeOld) lines.push({ label: `פירוק ופינוי מזגן ישן${units > 1 ? ` × ${units}` : ''}`, amount: r(p, 'disposal') * units });
    return [...lines, ...urgencyLines(a, p, sum(lines))];
  },
  summary: (a, p) => `${itemOf(p, 'service', a.service)?.name || ''}${a.units > 1 ? ` × ${a.units}` : ''}`,
  sampleAnswers: { service: 'install_2', units: 2, pipeMeters: 5, removeOld: true, floor: 4, balcony: true, urgency: 'week', address: 'ז׳בוטינסקי 50, רמת גן' },
  landing: {
    headline: 'קיץ. 38 מעלות. הטלפון לא מפסיק. תן לטופס לענות.',
    sub: 'הלקוח בוחר התקנה, ניקוי או תקלה, כמה מזגנים, אורך צנרת וקומה – ומקבל מחיר לפי המחירון שלך. בעונה, זה ההבדל בין לענות לכולם לבין לפספס עבודות.',
    pains: [
      { title: 'עונה של 4 חודשים', text: 'ביוני-אוגוסט אין לך זמן לענות לשיחות "כמה עולה התקנה". כל שיחה שלא נענתה הולכת למתחרה.' },
      { title: 'הפתעות בהתקנה', text: 'צנרת של 8 מטר, מעבה בקומה 5 בלי מרפסת, מזגן ישן לפינוי – כשזה לא נשאל מראש, זה ויכוח.' },
      { title: 'תיקונים בלי אבחון', text: 'לקוח רוצה מחיר לתקלה שעוד לא ראית. דמי ביקור מוצגים מראש, והמחיר הסופי אחרי אבחון.' },
    ],
    howCustomer: ['התקנה / ניקוי / מילוי גז / תקלה / העתקה', 'מספר מזגנים', 'אורך צנרת משוער', 'קומה וגישה למעבה', 'פירוק מזגן ישן'],
    scenario: 'אבי מרמת גן צריך 2 מזגנים של 1.5 כ״ס עם 5 מטר צנרת ופינוי הישנים. הוא רואה {price} ומבקש תיאום. אתה רואה בלוח את כל הפרטים ושולח הצעה סופית בוואטסאפ.',
    faq: [
      { q: 'מה עם תקלות שאי אפשר לתמחר מראש?', a: 'עבור תקלות מוצגים דמי ביקור ואבחון בלבד, והלקוח יודע שהמחיר הסופי ייקבע במקום.' },
      { q: 'מתאים גם לחברות מיזוג עם כמה טכנאים?', a: 'כן. במסלול העסקי אפשר לצרף עד 5 משתמשים.' },
    ],
  },
};
export default ac;
