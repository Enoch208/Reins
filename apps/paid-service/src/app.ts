import type { FacilitatorClient } from "@okxweb3/x402-core/server";
import { paymentMiddlewareFromHTTPServer } from "@okxweb3/x402-hono";
import { Hono } from "hono";
import type { Pricing } from "./env";
import { fetchSnapshot } from "./market/fetch-snapshot";
import { parseInstrument, type FetchLike } from "./market/snapshot";
import { serviceName, operatorLabel } from "./operator";
import { createPaymentServer } from "./payment";

export interface AppDependencies {
  readonly facilitator: FacilitatorClient;
  readonly pricing: Pricing;
  readonly fetchUpstream: FetchLike;
}

export async function createApp(deps: AppDependencies): Promise<Hono> {
  const paymentServer = await createPaymentServer(deps.facilitator, deps.pricing);
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({
      service: serviceName,
      operator: operatorLabel,
      network: deps.pricing.network,
      payTo: deps.pricing.payTo,
      price: deps.pricing.price,
      priceAtomic: deps.pricing.amountAtomic,
      asset: { symbol: deps.pricing.asset.symbol, address: deps.pricing.asset.address },
      facilitatorConfigured: true,
    }),
  );

  app.use(paymentMiddlewareFromHTTPServer(paymentServer, undefined, undefined, false));

  app.get("/market-data", async (c) => {
    const instrument = parseInstrument(c.req.query("instId") ?? "");
    if (instrument === null) {
      return c.json({ operator: operatorLabel, error: "instId must look like BTC-USDT" }, 400);
    }
    const result = await fetchSnapshot(deps.fetchUpstream, instrument);
    if (!result.ok) {
      return c.json(
        {
          operator: operatorLabel,
          error: "Every market data source failed",
          failures: result.failures,
        },
        502,
      );
    }
    return c.json({ operator: operatorLabel, ...result.snapshot });
  });

  return app;
}
