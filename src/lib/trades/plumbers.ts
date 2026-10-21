import type { TradeConfig } from './types';
import { itemOf, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const plumbers: TradeConfig = {
  slug: 'plumbers',
  name: 'אינסטלציה',
  pro: 'אינסטלטורים',
  proSingular: 'אינסטלטור',
  tagline: 'סתימות, נזילות, דודים והתקנות',
  accent: '#0f8b8d',
  rates: [
    { key: 'callout', label: 'דמי קריאה / הגעה', default: 200, unit: 'ils', hint: 'נגבה בכל קריאה' },
    { key: 'extraUnit', label: 'לכל יחידה נוספת מאותו סוג', default: 60, unit: 'pct', hint: 'אחוז ממחיר העבודה, למשל ברז שני' },
    ...URGENCY_RATES,
    { key: 'minPrice', label: 'מחיר מינימום לקריאה', default: 300, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'service', label: 'סוגי עבודות', hint: 'המחיר לעבודה עצמה, בנוסף לדמי הקריאה',
      items: [
        { key: 'clog_sink', name: 'פתיחת סתימה – כיור / מקלחת', price: 250 },
        { key: 'clog_toilet', name: 'פתיחת סתימה – אסלה', price: 300 },
        { key: 'clog_main', name: 'סתימה בקו ראשי / ביוב', price: 550 },
        { key: 'leak', name: 'נזילה גלויה – תיקון', price: 300 },
        { key: 'leak_detect', name: 'איתור נזילה סמויה (מצלמה / מכשור)', price: 850 },
        { key: 'faucet', name: 'החלפת / התקנת ברז', price: 250 },
        { key: 'toilet_install', name: 'החלפת אסלה / מיכל הדחה', price: 600 },
        { key: 'heater_fix', name: 'תיקון דוד חשמל / שמש', price: 400 },
        { key: 'heater_install', name: 'התקנת דוד חדש', price: 1200 },
        { key: 'pipe_burst', name: 'פיצוץ צנרת', price: 650 },
        { key: 'other', name: 'אחר – יתואר בהערות', price: 0 },
      ],
    },
  ],
  sections: [
    { title: 'מה הבעיה?', fields: [
      { type: 'choice', key: 'service', label: 'בחרו את סוג העבודה', group: 'service', required: true },
      { type: 'number', key: 'units', label: 'כמה יחידות? (למשל 2 ברזים)', min: 1, max: 10, default: 1, half: true },
      { type: 'select', key: 'property', label: 'סוג הנכס', half: true, default: 'apartment', options: [
        { value: 'apartment', label: 'דירה' }, { value: 'house', label: 'בית פרטי' }, { value: 'business', label: 'עסק / משרד' } ] },
      { type: 'textarea', key: 'notes', label: 'תארו בקצרה מה קורה', placeholder: 'למשל: מים עולים מהניקוז במקלחת, התחיל הבוקר' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'כמה דחוף?' },
      { type: 'yesno', key: 'night', label: 'הקריאה בלילה / בשבת?', default: false },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const it = itemOf(p, 'service', a.service);
    const units = Math.max(1, Number(a.units || 1));
    const work = [{ label: 'דמי קריאה', amount: r(p, 'callout') }];
    if (it) {
      work.push({ label: it.name, amount: it.price });
      if (units > 1) work.push({ label: `יחידות נוספות × ${units - 1}`, amount: it.price * (units - 1) * (r(p, 'extraUnit') / 100) });
    }
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => itemOf(p, 'service', a.service)?.name || '',
  sampleAnswers: { service: 'clog_toilet', units: 1, urgency: 'now', night: false, address: 'סוקולוב 8, הרצליה' },
  landing: {
    headline: 'סתימה בעשר בלילה? הלקוח כבר יודע כמה זה יעלה לפני שהתקשר.',
    sub: 'הלקוח בוחר מה הבעיה, כמה זה דחוף ואיפה – ומקבל הערכה לפי המחירון שלך, כולל דמי קריאה ותוספת דחיפות. אתה מקבל קריאה מסוננת ומוכנה.',
    pains: [
      { title: '"כמה עולה לפתוח סתימה?"', text: 'אותה שאלה, 15 פעם ביום, באמצע עבודה עם ידיים רטובות.' },
      { title: 'לקוחות שמשווים מחיר', text: 'אתה מסביר, הם "יחזרו אליך" – ונעלמים. בזבוז זמן על מי שלא מתכוון להזמין.' },
      { title: 'תוספת דחיפות שמביכה לבקש', text: 'כשהמחיר עם התוספת כתוב מראש, אין ויכוח בסוף העבודה.' },
    ],
    howCustomer: ['סוג התקלה (סתימה, נזילה, דוד, התקנה...)', 'כמה יחידות', 'דירה, בית או עסק', 'כמה דחוף – עכשיו / היום / השבוע', 'כתובת'],
    scenario: 'יוסי מהרצליה, אסלה סתומה, 21:40. הוא מוצא אותך בגוגל, לוחץ "הצעת מחיר", בוחר "סתימה באסלה – דחוף" ורואה {price}. אצלך קופצת בקשה עם הכתובת וכפתור Waze. אתה יוצא לדרך בלי שיחת מיקוח.',
    faq: [
      { q: 'מה אם הבעיה מסובכת יותר ממה שהלקוח תיאר?', a: 'ההצעה מוצגת כהערכה. אתה מעדכן מחיר סופי בבקשה ושולח ללקוח בוואטסאפ לפני העבודה.' },
      { q: 'אפשר לגבות דמי קריאה?', a: 'כן. דמי הקריאה, תוספת דחוף ותוספת לילה/שבת – הכל לפי מה שאתה קובע.' },
    ],
  },
};
export default plumbers;
