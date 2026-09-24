export interface MarketSource {
  readonly name: string;
  readonly url: string;
}

export interface MarketSnapshot {
  readonly instId: string;
  readonly source: MarketSource;
  readonly fetchedAt: string;
  readonly sourceTimestamp: string;
  readonly quoteCurrency: string;
  readonly last: string;
  readonly high24h: string;
  readonly low24h: string;
  readonly volume24hQuote: string;
}

export type FetchLike = (url: string, init: { signal: AbortSignal }) => Promise<Response>;

export interface Instrument {
  readonly instId: string;
  readonly base: string;
  readonly quote: string;
}

export const instIdPattern = /^([A-Z0-9]{2,15})-([A-Z0-9]{2,15})$/;

export function parseInstrument(instId: string): Instrument | null {
  const match = instIdPattern.exec(instId);
  const base = match?.[1];
  const quote = match?.[2];
  if (base === undefined || quote === undefined) {
    return null;
  }
  return { instId, base, quote };
}
