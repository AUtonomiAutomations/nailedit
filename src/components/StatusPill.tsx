import type { RequestStatus } from '@/lib/db/types';
export const STATUS: Record<RequestStatus, string> = { new: 'חדש', quoted: 'נשלחה הצעה', won: 'נסגר', lost: 'לא רלוונטי' };
export const SUB_STATUS: Record<string, string> = { trialing: 'ניסיון', active: 'פעיל', past_due: 'חוב בתשלום', canceled: 'בוטל', expired: 'פג תוקף' };
export default function StatusPill({ s }: { s: RequestStatus }) { return <span className={`pill st-${s}`}>{STATUS[s]}</span>; }
