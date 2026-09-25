import { parseMicros, type CreateJobBody } from "@reins/core";
import { SceneAbort, type Scene, type SceneContext } from "../scene";

const price = "0.01";
const minimumBalanceMicros = 20_000;
const jobLifetimeMs = 30 * 60 * 1000;

function purchaseJobBody(): CreateJobBody {
  return {
    title: "Live payment — ACME market data",
    customer: "ACME",
    revenue: null,
    maxBudget: "0.05",
    maxPerPurchase: "0.02",
    allowedServices: ["market-data"],
    expiresAt: new Date(Date.now() + jobLifetimeMs).toISOString(),
    delegationAllowed: false,
    isDemoData: true,
  };
}

export async function requireFundedWallet(context: SceneContext): Promise<void> {
  const wallet = await context.client.wallet();
  context.say(
    `payer wallet ${wallet.status}, ${wallet.address ?? "no address"}, ${wallet.balance ?? "?"} ${wallet.asset}`,
  );
  if (wallet.status !== "READY") {
    throw new SceneAbort("the payer wallet is not READY; log in with onchainos wallet login");
  }
  const balance = wallet.balance === null ? null : parseMicros(wallet.balance);
  if (balance === null || balance < minimumBalanceMicros) {
    throw new SceneAbort(
      `fund ${wallet.address ?? "the payer wallet"} with USDT0 on X Layer first`,
    );
  }
}

export async function requireService(context: SceneContext, serviceUrl: string): Promise<void> {
  const response = await fetch(new URL("/health", serviceUrl)).catch((error: unknown) => {
    throw new SceneAbort(`paid service unreachable at ${serviceUrl}: ${String(error)}`);
  });
  if (!response.ok) {
    throw new SceneAbort(`paid service health returned HTTP ${String(response.status)}`);
  }
  context.say(`paid service healthy at ${serviceUrl}`);
}

export function purchaseScene(serviceUrl: string | null): Scene {
  return {
    name: "purchase",
    title: "A real paid purchase: reserve, pay through the Agentic Wallet, settle on X Layer",
    summary: "moves real USDT0 on X Layer; run it on purpose, never part of all",
    async run(context) {
      if (serviceUrl === null) {
        throw new SceneAbort("set PAID_SERVICE_URL to the Reins paid service base URL");
      }
      await requireFundedWallet(context);
      await requireService(context, serviceUrl);
      const job = await context.createJob(purchaseJobBody());
      const agent = await context.attach(job, "MarketDataAgent", "market-data");
      const operationId = `live-market-data-${crypto.randomUUID()}`;
      const body = {
        agentId: agent.id,
        service: "market-data",
        operationId,
        url: new URL("/market-data?instId=BTC-USDT", serviceUrl).href,
        maxAmount: "0.02",
      };
      const first = await context.client.purchase(job.id, body);
      if (first.decision !== "APPROVED") {
        throw new SceneAbort(`the purchase was DENIED ${first.reason}`);
      }
      context.say(`outcome ${first.outcome}, tx ${first.authorization.txHash ?? "none"}`);
      context.checkEqual("the payment SETTLED on X Layer", first.outcome, "SETTLED");
      context.check("a transaction hash was recorded", first.authorization.txHash !== null);
      context.checkEqual("the network is X Layer", first.authorization.network, "eip155:196");
      context.check("the purchased data was delivered", first.deliverable !== null);
      const retry = await context.client.purchase(job.id, body);
      context.check(
        "a retry returns the same authorization without paying again",
        retry.decision === "APPROVED" &&
          retry.replayed &&
          retry.authorization.id === first.authorization.id,
      );
      await context.checkBudget(job, { settled: price, reserved: "0.00", unresolved: "0.00" });
    },
  };
}
