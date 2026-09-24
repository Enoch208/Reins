import { coinGeckoMarketsUrl, shapeCoinGeckoMarkets } from "./coingecko";
import { okxTickerUrl, shapeOkxTicker } from "./okx";
import type { FetchLike, Instrument, MarketSnapshot } from "./snapshot";

const upstreamTimeoutMs = 5_000;

type Shaper = (
  instrument: Instrument,
  body: unknown,
  url: string,
  fetchedAt: Date,
) => MarketSnapshot;

interface Upstream {
  readonly url: string;
  readonly shape: Shaper;
}

export type SnapshotResult =
  | { readonly ok: true; readonly snapshot: MarketSnapshot }
  | { readonly ok: false; readonly failures: readonly string[] };

function upstreamsFor(instrument: Instrument): Upstream[] {
  const upstreams: Upstream[] = [{ url: okxTickerUrl(instrument), shape: shapeOkxTicker }];
  const coinGeckoUrl = coinGeckoMarketsUrl(instrument);
  if (coinGeckoUrl !== null) {
    upstreams.push({ url: coinGeckoUrl, shape: shapeCoinGeckoMarkets });
  }
  return upstreams;
}

async function readUpstream(
  fetchFn: FetchLike,
  instrument: Instrument,
  upstream: Upstream,
): Promise<MarketSnapshot> {
  const response = await fetchFn(upstream.url, { signal: AbortSignal.timeout(upstreamTimeoutMs) });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  const body: unknown = await response.json();
  return upstream.shape(instrument, body, upstream.url, new Date());
}

export async function fetchSnapshot(
  fetchFn: FetchLike,
  instrument: Instrument,
): Promise<SnapshotResult> {
  const failures: string[] = [];
  for (const upstream of upstreamsFor(instrument)) {
    try {
      return { ok: true, snapshot: await readUpstream(fetchFn, instrument, upstream) };
    } catch (error) {
      failures.push(`${upstream.url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { ok: false, failures };
}
