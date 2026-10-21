export const BRAND = 'NailedIt';

export const floorLabel = (f: number | string) => (Number(f) === 0 ? 'קרקע' : 'קומה ' + f);
export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export function waPhone(p: string) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return d;
}
export const waLink = (phone: string, text: string) => `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`;
export const wazeLink = (addr: string) => `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`;
export const routeLink = (stop: string, destination: string) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(stop)}`;

export const fmtDate = (d: string | number | Date) =>
  new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
export const fmtDateTime = (d: string | number | Date) =>
  new Date(d).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function slugify(name: string, fallback = 'biz') {
  const latin = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (latin || fallback) + '-' + Math.random().toString(36).slice(2, 7);
}

export const daysLeft = (iso: string | null) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)) : 0;

export const cityFromAddress = (addr: string) => (addr || '').split(',').pop()?.trim() || '';
