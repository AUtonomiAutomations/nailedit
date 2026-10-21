import type { TradeConfig } from './types';
import { itemLines, itemOf, r, sum } from '../pricing';

const painters: TradeConfig = {
  slug: 'painters',
  name: 'צבע ושפכטל',
  pro: 'צבעים',
  proSingular: 'צבעי',
  tagline: 'צביעת דירות, חדרים ותיקוני קירות',
  accent: '#7c3aed',
  rates: [
    { key: 'ceilingPct', label: 'תוספת לצביעת תקרות (%)', default: 25, unit: 'pct' },
    { key: 'darkPct', label: 'תוספת למעבר מגוון כהה לבהיר / צבע חזק (%)', default: 20, unit: 'pct' },
    { key: 'furnishedPct', label: 'תוספת לדירה מאוכלסת – כיסוי והזזת רהיטים (%)', default: 15, unit: 'pct' },
    { key: 'repairsLight', label: 'תיקוני שפכטל קלים', default: 300, unit: 'ils' },
    { key: 'repairsHeavy', label: 'תיקוני שפכטל / סדקים נרחבים', default: 900, unit: 'ils' },
    { key: 'minPrice', label: 'מחיר מינימום לעבודה', default: 800, unit: 'ils' },
  ],
  itemGroups: [
    {
      key: 'scope', label: 'מחיר לפי היקף', hint: 'מחיר לצביעת קירות בצבע סופרקריל, 2 שכבות',
      items: [
        { key: 'room', name: 'חדר בודד', price: 650 },
        { key: 'apt2', name: 'דירת 2 חדרים', price: 2200 },
        { key: 'apt3', name: 'דירת 3 חדרים', price: 2900 },
        { key: 'apt4', name: 'דירת 4 חדרים', price: 3600 },
        { key: 'apt5', name: 'דירת 5 חדרים', price: 4300 },
        { key: 'house', name: 'בית פרטי / דופלקס', price: 6500 },
      ],
    },
    {
      key: 'extras', label: 'תוספות',
      items: [
        { key: 'door', name: 'צביעת דלת פנים', price: 180 },
        { key: 'frame', name: 'צביעת משקוף', price: 90 },
        { key: 'radiator', name: 'צביעת רדיאטור / סורג', price: 150 },
        { key: 'mold', name: 'טיפול בעובש (לקיר)', price: 250 },
      ],
    },
  ],
  sections: [
    { title: 'מה צובעים?', fields: [
      { type: 'choice', key: 'scope', label: 'היקף העבודה', group: 'scope', required: true },
      { type: 'number', key: 'rooms', label: 'אם בחרתם "חדר בודד" – כמה חדרים?', min: 1, max: 10, default: 1, half: true },
      { type: 'yesno', key: 'ceilings', label: 'לצבוע גם תקרות?', default: true, half: true },
      { type: 'yesno', key: 'dark', label: 'מעבר מצבע כהה / צבע חזק?', default: false, half: true },
      { type: 'yesno', key: 'furnished', label: 'הדירה מאוכלסת (יש רהיטים)?', default: true, half: true },
      { type: 'select', key: 'repairs', label: 'מצב הקירות', default: 'none', options: [
        { value: 'none', label: 'תקין – רק צבע' }, { value: 'light', label: 'חורים וסדקים קטנים' }, { value: 'heavy', label: 'סדקים, רטיבות, קילופים' } ] },
      { type: 'items', key: 'extras', label: 'תוספות', group: 'extras', maxQty: 20 },
    ] },
    { title: 'מתי ואיפה?', fields: [
      { type: 'date', key: 'date', label: 'מתי תרצו להתחיל?', half: true },
      { type: 'address', key: 'address', label: 'כתובת (רחוב, מספר, עיר)', required: true },
      { type: 'textarea', key: 'notes', label: 'הערות', placeholder: 'גוונים, גובה תקרה חריג, קיר מבטא...' },
    ] },
  ],
  addressKey: 'address',
  compute(a, p) {
    const it = itemOf(p, 'scope', a.scope);
    const rooms = a.scope === 'room' ? Math.max(1, Number(a.rooms || 1)) : 1;
    const base = it ? it.price * rooms : 0;
    const lines = [{ label: `${it?.name || 'צביעה'}${rooms > 1 ? ` × ${rooms}` : ''}`, amount: base }];
    if (a.ceilings) lines.push({ label: `תקרות (+${r(p, 'ceilingPct')}%)`, amount: (base * r(p, 'ceilingPct')) / 100 });
    if (a.dark) lines.push({ label: `מעבר מצבע כהה (+${r(p, 'darkPct')}%)`, amount: (base * r(p, 'darkPct')) / 100 });
    if (a.furnished) lines.push({ label: `דירה מאוכלסת (+${r(p, 'furnishedPct')}%)`, amount: (base * r(p, 'furnishedPct')) / 100 });
    if (a.repairs === 'light') lines.push({ label: 'תיקוני שפכטל קלים', amount: r(p, 'repairsLight') });
    if (a.repairs === 'heavy') lines.push({ label: 'תיקוני קירות נרחבים', amount: r(p, 'repairsHeavy') });
    lines.push(...itemLines(p, 'extras', a.extras));
    return lines;
  },
  summary: (a, p) => `${itemOf(p, 'scope', a.scope)?.name || ''}${a.ceilings ? ' + תקרות' : ''}`,
  sampleAnswers: { scope: 'apt4', ceilings: true, dark: false, furnished: true, repairs: 'light', extras: { door: 4 }, address: 'אחד העם 15, רעננה' },
  landing: {
    headline: 'הצעת מחיר לצביעת דירה – בלי לנסוע למדוד.',
    sub: 'הלקוח בוחר היקף (חדר, 3 חדרים, בית), תקרות, מצב הקירות ותוספות כמו דלתות. המערכת מחשבת לפי המחירון שלך, ואתה נוסע רק ללקוחות שכבר ראו מחיר והסכימו.',
    pains: [
      { title: 'נסיעות למדידה שלא נסגרות', text: 'שעה הלוך-חזור בשביל לקוח שאסף 4 הצעות ובחר בזולה.' },
      { title: 'ה"רק תקרה אחת" בסוף', text: 'תוספות שלא סוכמו מראש הופכות לוויכוח ביום האחרון.' },
      { title: 'הצעות בכתב יד', text: 'הלקוח רוצה משהו מסודר לשלוח לבן/בת הזוג. אתה שולח הודעה קולית.' },
    ],
    howCustomer: ['היקף: חדר / דירה לפי חדרים / בית', 'תקרות', 'צבע כהה או חזק', 'דירה מאוכלסת', 'מצב הקירות ותוספות (דלתות, רדיאטורים)'],
    scenario: 'רון מרעננה רוצה לצבוע דירת 4 חדרים עם תקרות, דירה מאוכלסת, 4 דלתות וקצת שפכטל. הוא רואה {price} ושולח לך הודעה "מתי אפשר להתחיל?". המדידה הופכת לביקור סגירה.',
    faq: [
      { q: 'המחיר כולל חומרים?', a: 'זה תלוי במחירון שלך. אפשר לכתוב בהערות לטופס מה כלול, ולעדכן מחיר סופי בכל בקשה.' },
      { q: 'אפשר לתמחר לפי מ״ר?', a: 'בגרסה הזו התמחור לפי היקף וחדרים, שזה מה שלקוחות יודעים לענות. תמחור לפי מ״ר יתווסף בהמשך.' },
    ],
  },
};
export default painters;
