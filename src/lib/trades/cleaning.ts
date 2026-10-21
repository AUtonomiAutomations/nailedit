import type { TradeConfig } from './types';
import { itemLines, itemOf, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const cleaning: TradeConfig = {
  slug: 'cleaning',
  name: 'ניקיון, חלונות וספות',
  pro: 'חברות ניקיון',
  proSingular: 'איש ניקיון',
  tagline: 'דירות, אחרי שיפוץ, חלונות, ספות ושטיחים',
  accent: '#db2777',
  rates: [
    { key: 'perRoom', label: 'תוספת לכל חדר מעבר ל-3', default: 120, unit: 'ils' },
    { key: 'perBath', label: 'לכל חדר רחצה / שירותים', default: 90, unit: 'ils' },
    { key: 'materials', label: 'חומרי ניקוי וציוד (קבוע)', default: 60, unit: 'ils' },
    ...URGENCY_RATES.filter((x) => x.key !== 'nightPct'),
    { key: 'minPrice', label: 'מחיר מינימום', default: 300, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'service', label: 'סוג ניקיון (מחיר לדירה עד 3 חדרים)',
      items: [
        { key: 'regular', name: 'ניקיון שוטף', price: 350 },
        { key: 'deep', name: 'ניקיון יסודי', price: 650 },
        { key: 'move', name: 'ניקיון לפני כניסה / אחרי יציאה', price: 800 },
        { key: 'reno', name: 'ניקיון אחרי שיפוץ', price: 1200 },
        { key: 'none', name: 'בלי ניקיון דירה – רק ספות / חלונות', price: 0 },
      ],
    },
    {
      key: 'addons', label: 'שירותים נוספים (ליחידה)',
      items: [
        { key: 'sofa_seat', name: 'ניקוי ספה – למושב', price: 70 },
        { key: 'armchair', name: 'ניקוי כורסה', price: 120 },
        { key: 'mattress', name: 'ניקוי מזרן', price: 180 },
        { key: 'carpet', name: 'ניקוי שטיח (עד 6 מ״ר)', price: 200 },
        { key: 'window', name: 'ניקוי חלון (פנים + חוץ)', price: 40 },
        { key: 'glass_wall', name: 'ויטרינה / דלת זכוכית גדולה', price: 90 },
        { key: 'oven', name: 'ניקוי תנור', price: 150 },
        { key: 'fridge', name: 'ניקוי מקרר מבפנים', price: 120 },
      ],
    },
  ],
  sections: [
    { title: 'מה מנקים?', fields: [
      { type: 'choice', key: 'service', label: 'סוג הניקיון', group: 'service', required: true },
      { type: 'number', key: 'rooms', label: 'מספר חדרים', min: 1, max: 12, step: 0.5, default: 3, half: true },
      { type: 'number', key: 'baths', label: 'חדרי רחצה / שירותים', min: 0, max: 6, default: 1, half: true },
      { type: 'items', key: 'addons', label: 'ספות, חלונות ועוד', group: 'addons', maxQty: 40 },
      { type: 'textarea', key: 'notes', label: 'הערות', placeholder: 'חיות בבית, קומה, חניה, סוג ריפוד...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'מתי?' },
      { type: 'date', key: 'date', label: 'תאריך מועדף', half: true },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const it = itemOf(p, 'service', a.service);
    const work: { label: string; amount: number }[] = [];
    if (it && it.price) {
      work.push({ label: it.name, amount: it.price });
      const extraRooms = Math.max(0, Number(a.rooms || 0) - 3);
      if (extraRooms) work.push({ label: `חדרים נוספים × ${extraRooms}`, amount: extraRooms * r(p, 'perRoom') });
      if (a.baths > 0) work.push({ label: `חדרי רחצה × ${a.baths}`, amount: a.baths * r(p, 'perBath') });
      work.push({ label: 'חומרים וציוד', amount: r(p, 'materials') });
    }
    work.push(...itemLines(p, 'addons', a.addons));
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => {
    const s = itemOf(p, 'service', a.service);
    const n = Object.keys(a.addons || {}).length;
    return `${s && s.price ? s.name : ''}${n ? `${s && s.price ? ' + ' : ''}${n} תוספות` : ''}`;
  },
  sampleAnswers: { service: 'move', rooms: 4, baths: 2, addons: { sofa_seat: 3, window: 8 }, urgency: 'week', address: 'בן יהודה 100, תל אביב' },
  landing: {
    headline: 'ניקיון לפני כניסה, ספה ו-8 חלונות. מחיר אחד, בלי סיור בדירה.',
    sub: 'הלקוח בוחר סוג ניקיון, חדרים, חדרי רחצה ותוספות כמו ספות וחלונות – ורואה מחיר לפי המחירון שלך. מתאים לחברות ניקיון, ניקוי ספות ושטיפת חלונות.',
    pains: [
      { title: '"כמה עולה ניקיון לדירת 4 חדרים?"', text: 'השאלה שכל העסק שלך עונה עליה. עכשיו הטופס עונה במקומך.' },
      { title: 'מחירים לא אחידים', text: 'כל עובד במשרד נותן מחיר אחר. מחירון אחד במערכת = מחיר עקבי לכל לקוח.' },
      { title: 'תוספות שנשכחות', text: 'תנור, מקרר, חלונות – הלקוח מסמן מראש, ואתה שולח צוות מתאים.' },
    ],
    howCustomer: ['סוג הניקיון (שוטף, יסודי, לפני כניסה, אחרי שיפוץ)', 'מספר חדרים וחדרי רחצה', 'ספות, כורסאות, מזרנים, שטיחים', 'מספר חלונות', 'מתי וכתובת'],
    scenario: 'גל נכנס לדירת 4 חדרים בתל אביב בשבוע הבא. הוא מבקש ניקיון לפני כניסה, 2 חדרי רחצה, ספה תלת-מושבית ו-8 חלונות, ורואה {price}. הבקשה מגיעה אליך עם כל הפרטים לשיבוץ צוות.',
    faq: [
      { q: 'אני עושה רק ניקוי ספות', a: 'מצוין. הלקוח בוחר "רק ספות / חלונות", ואפשר למחוק מהמחירון את סוגי הניקיון שאתה לא נותן.' },
      { q: 'אפשר לקבוע מחיר לפי שעות?', a: 'כרגע לפי סוג ניקיון וגודל. תמחור לפי שעות עבודה יתווסף כאופציה.' },
    ],
  },
};
export default cleaning;
