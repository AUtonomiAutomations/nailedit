import type { TradeConfig } from './types';
import { itemLines, r, sum, urgencyLines, URGENCY_RATES } from '../pricing';

const handyman: TradeConfig = {
  slug: 'handyman',
  name: 'הנדימן',
  pro: 'הנדימנים',
  proSingular: 'הנדימן',
  tagline: 'תליות, הרכבות ותיקונים קטנים בבית',
  accent: '#c2410c',
  rates: [
    { key: 'visit', label: 'דמי הגעה', default: 150, unit: 'ils' },
    { key: 'materials', label: 'תוספת אם אני מביא חומרים (%)', default: 15, unit: 'pct' },
    ...URGENCY_RATES.filter((x) => x.key !== 'nightPct'),
    { key: 'minPrice', label: 'מחיר מינימום לביקור', default: 350, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'tasks', label: 'מחירון משימות', hint: 'מחיר ליחידה; הלקוח בוחר כמה',
      items: [
        { key: 'shelf', name: 'תליית מדף', price: 90 },
        { key: 'picture', name: 'תליית תמונה / מראה', price: 60 },
        { key: 'tv_mount', name: 'תליית טלוויזיה על הקיר', price: 300 },
        { key: 'curtain', name: 'התקנת מוט / מסילת וילון', price: 140 },
        { key: 'ikea_small', name: 'הרכבת רהיט קטן (שידה, מדפים)', price: 150 },
        { key: 'ikea_big', name: 'הרכבת ארון / מיטה', price: 400 },
        { key: 'door_fix', name: 'כיוון / תיקון דלת או ציר', price: 120 },
        { key: 'handle', name: 'החלפת ידית / מנעול ארון', price: 50 },
        { key: 'silicone', name: 'איטום סיליקון (אמבטיה / כיור)', price: 200 },
        { key: 'lamp', name: 'החלפת גוף תאורה פשוט', price: 150 },
        { key: 'wall_patch', name: 'תיקון חור בקיר + שפכטל', price: 120 },
        { key: 'blind', name: 'תיקון רצועת תריס', price: 180 },
      ],
    },
  ],
  sections: [
    { title: 'מה צריך לעשות?', fields: [
      { type: 'items', key: 'tasks', label: 'סמנו את כל המשימות (אפשר כמה)', group: 'tasks', maxQty: 20, required: true },
      { type: 'yesno', key: 'materials', label: 'שההנדימן יביא את החומרים (ברגים, דיבלים, סיליקון)?', default: false },
      { type: 'textarea', key: 'notes', label: 'פרטים נוספים', placeholder: 'סוג הקיר (בטון / גבס), גובה, מידות...' },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'urgency', key: 'urgency', label: 'מתי?' },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const tasks = itemLines(p, 'tasks', a.tasks);
    const work = [{ label: 'דמי הגעה', amount: r(p, 'visit') }, ...tasks];
    if (a.materials) work.push({ label: `חומרים (+${r(p, 'materials')}%)`, amount: (sum(tasks) * r(p, 'materials')) / 100 });
    return [...work, ...urgencyLines(a, p, sum(work))];
  },
  summary: (a, p) => {
    const n = Object.values(a.tasks || {}).reduce((s: number, q: any) => s + Number(q || 0), 0);
    const first = Object.keys(a.tasks || {})[0];
    const nm = (p.items.tasks || []).find((i) => i.key === first)?.name;
    return nm ? `${nm}${n > 1 ? ` ועוד ${n - 1}` : ''}` : '';
  },
  sampleAnswers: { tasks: { tv_mount: 1, shelf: 3, curtain: 2 }, materials: true, urgency: 'week', address: 'הנשיא 20, חיפה' },
  landing: {
    headline: 'רשימת המשימות של הלקוח – עם מחיר, לפני שיצאת מהבית.',
    sub: 'הלקוח מסמן מה צריך: טלוויזיה, 3 מדפים, וילון. המערכת מחברת את המחירון שלך, דמי הגעה וחומרים – ושולחת לך עבודה מוגדרת עם מחיר.',
    pains: [
      { title: '"רק כמה דברים קטנים"', text: 'מגיעים ומגלים רשימה של 12 משימות. המחיר שסגרת בטלפון כבר לא רלוונטי.' },
      { title: 'עבודות קטנות לא משתלמות', text: 'בלי מחיר מינימום ודמי הגעה, נסיעה בשביל מדף אחד היא הפסד.' },
      { title: 'תיאום בהודעות', text: 'תמונות, הקלטות, "אתה יכול גם...". הכל מפוזר בוואטסאפ.' },
    ],
    howCustomer: ['רשימת משימות עם כמויות', 'האם להביא חומרים', 'סוג הקיר ופרטים', 'מתי', 'כתובת'],
    scenario: 'מיכל מחיפה סימנה: תליית טלוויזיה, 3 מדפים ו-2 מסילות וילון, עם חומרים. היא רואה {price}. אתה מקבל רשימה מסודרת ויודע בדיוק כמה זמן לשריין.',
    faq: [
      { q: 'מה אם יש משימה שלא ברשימה?', a: 'הלקוח מתאר אותה בהערות, ואתה מוסיף את המחיר כשאתה שולח הצעה סופית. את המחירון אפשר להרחיב בכל רגע.' },
      { q: 'אפשר מחיר מינימום לביקור?', a: 'כן. אם סכום המשימות נמוך מהמינימום, ההצעה מתעגלת אליו אוטומטית.' },
    ],
  },
};
export default handyman;
