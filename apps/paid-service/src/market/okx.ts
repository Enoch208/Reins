import { z } from "zod";
import type { Instrument, MarketSnapshot } from "./snapshot";

const okxTickerSchema = z.object({
  code: z.literal("0"),
  data: z
    .array(
      z.object({
        instId: z.string(),
        last: z.string().min(1),
        high24h: z.string().min(1),
        low24h: z.string().min(1),
        volCcy24h: z.string().min(1),
        ts: z.string().regex(/^\d+$/),
      }),
    )
    .min(1),
});

export function okxTickerUrl(instrument: Instrument): string {
  return `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instrument.instId)}`;
}

export function shapeOkxTicker(
  instrument: Instrument,
  body: unknown,
  url: string,
  fetchedAt: Date,
): MarketSnapshot {
  const ticker = okxTickerSchema.parse(body).data[0];
  if (ticker?.instId !== instrument.instId) {
    throw new Error(`OKX returned a ticker for a different instrument than ${instrument.instId}`);
  }
  return {
    instId: instrument.instId,
    source: { name: "OKX public market API", url },
    fetchedAt: fetchedAt.toISOString(),
    sourceTimestamp: new Date(Number(ticker.ts)).toISOString(),
    quoteCurrency: instrument.quote,
    last: ticker.last,
    high24h: ticker.high24h,
    low24h: ticker.low24h,
    volume24hQuote: ticker.volCcy24h,
  };
}
