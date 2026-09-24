import type { FacilitatorClient, RoutesConfig } from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { x402HTTPResourceServer, x402ResourceServer } from "@okxweb3/x402-hono";
import type { Pricing } from "./env";
import { operatorLabel } from "./operator";

const paymentWindowSeconds = 120;

export function paidRoutes(pricing: Pricing): RoutesConfig {
  return {
    "GET /market-data": {
      accepts: {
        scheme: "exact",
        network: pricing.network,
        payTo: pricing.payTo,
        price: {
          asset: pricing.asset.address,
          amount: pricing.amountAtomic,
          extra: { name: pricing.asset.eip712Name, version: pricing.asset.eip712Version },
        },
        maxTimeoutSeconds: paymentWindowSeconds,
      },
      description: `Market snapshot from a public source, sold by ${operatorLabel}`,
      mimeType: "application/json",
    },
  };
}

export async function createPaymentServer(
  facilitator: FacilitatorClient,
  pricing: Pricing,
): Promise<x402HTTPResourceServer> {
  const resourceServer = new x402ResourceServer(facilitator).register(
    pricing.network,
    new ExactEvmScheme(),
  );
  const httpServer = new x402HTTPResourceServer(resourceServer, paidRoutes(pricing));
  await httpServer.initialize();
  return httpServer;
}
