import { describe, expect, it } from "vitest";
import { coinGeckoMarketsUrl, shapeCoinGeckoMarkets } from "../src/market/coingecko";
import { fetchSnapshot } from "../src/market/fetch-snapshot";
import { okxTickerUrl, shapeOkxTicker } from "../src/market/okx";
import { parseInstrument, type FetchLike, type Instrument } from "../src/market/snapshot";

const btc: Instrument = { instId: "BTC-USDT", base: "BTC", quote: "USDT" };
const fetchedAt = new Date("2026-09-24T12:00:00.000Z");

const okxFixture = {
  code: "0",
  msg: "",
  data: [
    {
      instType: "SPOT",
      instId: "BTC-USDT",
      last: "84565.1",
      high24h: "84843.0",
      low24h: "82941.2",
      vol24h: "5012.3",
      volCcy24h: "421003112.5",
      ts: "1790251200000",
    },
  ],
};

const coinGeckoFixture = [
  {
    id: "bitcoin",
    symbol: "btc",
    current_price: 84578,
    high_24h: 84843,
    low_24h: 82941,
    total_volume: 39149153961,
    last_updated: "2026-09-24T11:59:30.000Z",
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("instrument parsing", () => {
  it("accepts exchange-style pairs and rejects anything else", () => {
    expect(parseInstrument("BTC-USDT")).toEqual(btc);
    expect(parseInstrument("btc-usdt")).toBeNull();
    expect(parseInstrument("BTC")).toBeNull();
    expect(parseInstrument("BTC-USDT&x=1")).toBeNull();
  });
});

describe("OKX ticker shaping", () => {
  it("keeps upstream values verbatim and records source and times", () => {
    const url = okxTickerUrl(btc);
    expect(shapeOkxTicker(btc, okxFixture, url, fetchedAt)).toEqual({
      instId: "BTC-USDT",
      source: {
        name: "OKX public market API",
        url: "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT",
      },
      fetchedAt: "2026-09-24T12:00:00.000Z",
      sourceTimestamp: new Date(1790251200000).toISOString(),
      quoteCurrency: "USDT",
      last: "84565.1",
      high24h: "84843.0",
      low24h: "82941.2",
      volume24hQuote: "421003112.5",
    });
  });

  it("rejects an OKX error body or a different instrument", () => {
    expect(() =>
      shapeOkxTicker(
        btc,
        { code: "51001", msg: "Instrument ID does not exist", data: [] },
        "u",
        fetchedAt,
      ),
    ).toThrow();
    const other = { ...okxFixture, data: [{ ...okxFixture.data[0], instId: "ETH-USDT" }] };
    expect(() => shapeOkxTicker(btc, other, "u", fetchedAt)).toThrow();
  });
});

describe("CoinGecko shaping", () => {
  it("labels the quote as USD, because CoinGecko prices in USD, not USDT", () => {
    const url = coinGeckoMarketsUrl(btc);
    expect(url).toBe("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=btc");
    const snapshot = shapeCoinGeckoMarkets(btc, coinGeckoFixture, url ?? "", fetchedAt);
    expect(snapshot).toMatchObject({
      quoteCurrency: "USD",
      last: "84578",
      volume24hQuote: "39149153961",
      sourceTimestamp: "2026-09-24T11:59:30.000Z",
      source: { name: "CoinGecko public API (coin id bitcoin)" },
    });
  });

  it("is not offered for non-dollar quotes and rejects an empty result", () => {
    expect(coinGeckoMarketsUrl({ instId: "ETH-BTC", base: "ETH", quote: "BTC" })).toBeNull();
    expect(() => shapeCoinGeckoMarkets(btc, [], "u", fetchedAt)).toThrow();
  });
});

describe("fetchSnapshot", () => {
  it("prefers OKX when it answers", async () => {
    const fetchFn: FetchLike = (url) =>
      Promise.resolve(jsonResponse(url.includes("okx.com") ? okxFixture : coinGeckoFixture));
    const result = await fetchSnapshot(fetchFn, btc);
    expect(result.ok && result.snapshot.source.name).toBe("OKX public market API");
  });

  it("falls back to CoinGecko when OKX is unreachable", async () => {
    const fetchFn: FetchLike = (url) =>
      url.includes("okx.com")
        ? Promise.reject(new Error("getaddrinfo ENOTFOUND www.okx.com"))
        : Promise.resolve(jsonResponse(coinGeckoFixture));
    const result = await fetchSnapshot(fetchFn, btc);
    expect(result.ok && result.snapshot.quoteCurrency).toBe("USD");
  });

  it("reports every failure when no source answers", async () => {
    const fetchFn: FetchLike = () => Promise.resolve(jsonResponse({ error: "down" }, 503));
    const result = await fetchSnapshot(fetchFn, btc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toHaveLength(2);
    expect(result.failures[0]).toContain("HTTP 503");
  });
});
