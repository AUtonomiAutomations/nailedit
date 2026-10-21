// A trade (movers, plumbers, ...) is fully described by a TradeConfig:
// the customer form, the editable price list, the pricing logic and the landing-page copy.

export type Item = { key: string; name: string; price: number };
export type ItemGroup = { key: string; label: string; hint?: string; items: Item[] };

export type Rate = {
  key: string;
  label: string;
  default: number;
  unit?: 'ils' | 'pct' | 'num';
  hint?: string;
};

/** What a business stores in businesses.pricing (jsonb) */
export type Pricing = {
  rates: Record<string, number>;
  items: Record<string, Item[]>;
  vatIncluded: boolean;
  showBreakdown: boolean;
};

export type Answers = Record<string, any>;

export type Field =
  | { type: 'text' | 'textarea' | 'date'; key: string; label: string; required?: boolean; placeholder?: string; half?: boolean }
  | { type: 'address'; key: string; label: string; required?: boolean; placeholder?: string }
  | { type: 'floor'; key: string; label: string; half?: boolean }
  | { type: 'yesno'; key: string; label: string; default?: boolean; half?: boolean }
  | { type: 'number'; key: string; label: string; min?: number; max?: number; step?: number; default?: number; suffix?: string; half?: boolean }
  | { type: 'select'; key: string; label: string; options: { value: string; label: string }[]; default?: string; half?: boolean }
  /** pick ONE item from an item group (big cards) – the item price is used by compute() */
  | { type: 'choice'; key: string; label: string; group: string; required?: boolean }
  /** pick MANY items from an item group, each with a quantity */
  | { type: 'items'; key: string; label: string; group: string; maxQty?: number; required?: boolean }
  | { type: 'urgency'; key: string; label: string };

export type Section = { title: string; fields: Field[] };

export type Line = { label: string; amount: number };
export type Quote = { lines: Line[]; total: number; low: number; high: number; vatIncluded: boolean };

export type ComputeCtx = { distanceKm: number | null };

export type TradeLanding = {
  headline: string;
  sub: string;
  pains: { title: string; text: string }[];
  howCustomer: string[];       // what the customer is asked, in plain words
  scenario: string;            // a short real-life story; {price} is replaced with the computed sample quote
  faq: { q: string; a: string }[];
};

export type TradeConfig = {
  slug: string;
  name: string;            // "אינסטלציה"
  pro: string;             // "אינסטלטורים" – who we're talking to
  proSingular: string;     // "אינסטלטור"
  tagline: string;         // one line for the trade picker
  accent: string;          // brand color for this trade
  rates: Rate[];
  itemGroups: ItemGroup[];
  sections: Section[];     // customer form (name + phone are added automatically)
  addressKey: string;      // which answer is the main address (stored in quote_requests.address)
  distance?: { from: string; to: string }; // compute driving distance between two address answers
  compute: (a: Answers, p: Pricing, ctx: ComputeCtx) => Line[];
  summary: (a: Answers, p: Pricing) => string; // one line for the requests table
  sampleAnswers: Answers;  // used to render a live example quote on the landing page
  sampleDistanceKm?: number;
  landing: TradeLanding;
};
