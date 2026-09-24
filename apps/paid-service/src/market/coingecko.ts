import { z } from "zod";
import type { Instrument, MarketSnapshot } from "./snapshot";

const dollarQuotes = new Set(["USDT", "USDC", "USD"]);

const coinGeckoMarketsSchema = z
  .array(
    z.object({
      id: z.string(),
      symbol: z.string(),
      current_price: z.number(),
      high_24h: z.number(),
      low_24h: z.number(),
      total_volume: z.number(),
      last_updated: z.iso.datetime(),
    }),
  )
  .min(1);

export function coinGeckoMarketsUrl(instrument: Instrument): string | null {
  if (!dollarQuotes.has(instrument.quote)) {
    return null;
  }
  const symbol = encodeURIComponent(instrument.base.toLowerCase());
  return `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=${symbol}`;
}

export function shapeCoinGeckoMarkets(
  instrument: Instrument,
  body: unknown,
  url: string,
  fetchedAt: Date,
): MarketSnapshot {
  const markets = coinGeckoMarketsSchema.parse(body);
  const coin = markets.find((entry) => entry.symbol.toUpperCase() === instrument.base);
  if (coin === undefined) {
    throw new Error(`CoinGecko returned no market for ${instrument.base}`);
  }
  return {
    instId: instrument.instId,
    source: { name: `CoinGecko public API (coin id ${coin.id})`, url },
    fetchedAt: fetchedAt.toISOString(),
    sourceTimestamp: coin.last_updated,
    quoteCurrency: "USD",
    last: String(coin.current_price),
    high24h: String(coin.high_24h),
    low24h: String(coin.low_24h),
    volume24hQuote: String(coin.total_volume),
  };
}
