import type { Quote } from '@/lib/trades/types';
import { nis, rangeText } from '@/lib/pricing';

export default function QuoteTicket({ quote, title = 'הצעת מחיר משוערת', meta, showLines = true, footer }:
  { quote: Quote; title?: string; meta?: string; showLines?: boolean; footer?: React.ReactNode }) {
  return (
    <div className="ticket">
      <div className="ticket-head">
        <span className="eyebrow">{title}</span>
        <span className="ticket-amount">{rangeText(quote)}</span>
        <span className="muted small">{quote.vatIncluded ? 'כולל מע״מ' : 'לא כולל מע״מ'}{meta ? ` · ${meta}` : ''}</span>
      </div>
      {showLines && (
        <>
          <div className="ticket-tear" />
          <div className="ticket-body">
            <table className="lines"><tbody>
              {quote.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td>{nis(l.amount)}</td></tr>)}
              <tr className="tot"><td>סה״כ מחושב</td><td>{nis(quote.total)}</td></tr>
            </tbody></table>
          </div>
        </>
      )}
      {footer && <div className="ticket-body" style={{ paddingTop: 0 }}>{footer}</div>}
    </div>
  );
}
