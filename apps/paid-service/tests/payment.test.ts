import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
  encodePaymentSignatureHeader,
} from "@okxweb3/x402-core/http";
import type { PaymentPayload } from "@okxweb3/x402-core/types";
import type { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadEnv, type Pricing } from "../src/env";
import type { FetchLike } from "../src/market/snapshot";
import { FakeFacilitator, fixturePayer, fixtureTransaction } from "./fake-facilitator";

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

function testPricing(): Pricing {
  const loaded = loadEnv({ OKX_API_KEY: "k", OKX_SECRET_KEY: "s", OKX_PASSPHRASE: "p" });
  if (!loaded.ok) throw new Error(loaded.problems.join("; "));
  return loaded.env.pricing;
}

const upstreamAnswers: FetchLike = (url) =>
  url.includes("okx.com")
    ? Promise.reject(new Error("getaddrinfo ENOTFOUND www.okx.com"))
    : Promise.resolve(new Response(JSON.stringify(coinGeckoFixture), { status: 200 }));

const upstreamDown: FetchLike = () => Promise.reject(new Error("getaddrinfo ENOTFOUND"));

async function challenge(app: Hono): Promise<PaymentPayload["accepted"]> {
  const response = await app.request("/market-data?instId=BTC-USDT");
  const header = response.headers.get("PAYMENT-REQUIRED");
  if (header === null) throw new Error("no PAYMENT-REQUIRED header");
  const [accepted] = decodePaymentRequiredHeader(header).accepts;
  if (accepted === undefined) throw new Error("no payment option offered");
  return accepted;
}

function signedPayment(accepted: PaymentPayload["accepted"]): string {
  return encodePaymentSignatureHeader({
    x402Version: 2,
    accepted,
    payload: {
      signature: `0x${"11".repeat(65)}`,
      authorization: {
        from: fixturePayer,
        to: accepted.payTo,
        value: accepted.amount,
        validAfter: "0",
        validBefore: "4102444800",
        nonce: `0x${"22".repeat(32)}`,
      },
    },
  });
}

describe("x402 paid market data", () => {
  it("answers an unpaid request with 402 and a PAYMENT-REQUIRED challenge for 0.01 USDT0 on X Layer", async () => {
    const facilitator = new FakeFacilitator("eip155:196");
    const app = await createApp({
      facilitator,
      pricing: testPricing(),
      fetchUpstream: upstreamAnswers,
    });

    const response = await app.request("/market-data?instId=BTC-USDT");
    expect(response.status).toBe(402);
    const header = response.headers.get("PAYMENT-REQUIRED");
    expect(header).not.toBeNull();
    const required = decodePaymentRequiredHeader(header ?? "");
    expect(required.x402Version).toBe(2);
    expect(required.accepts).toHaveLength(1);
    const [accepted] = required.accepts;
    expect(accepted?.scheme).toBe("exact");
    expect(accepted?.network).toBe("eip155:196");
    expect(accepted?.asset.toLowerCase()).toBe(
      "0x779Ded0c9e1022225f8E0630b35a9b54bE713736".toLowerCase(),
    );
    expect(accepted?.amount).toBe("10000");
    expect(accepted?.payTo).toBe("0x10eb4e5303af6bc785dbea34052298fa9f652d87");
    expect(accepted?.extra).toEqual({ name: "USD₮0", version: "1" });
    expect(facilitator.verified).toHaveLength(0);
    expect(facilitator.settled).toHaveLength(0);
  });

  it("serves the snapshot with a PAYMENT-RESPONSE after a verified payment settles", async () => {
    const facilitator = new FakeFacilitator("eip155:196");
    const app = await createApp({
      facilitator,
      pricing: testPricing(),
      fetchUpstream: upstreamAnswers,
    });
    const accepted = await challenge(app);

    const response = await app.request("/market-data?instId=BTC-USDT", {
      headers: { "PAYMENT-SIGNATURE": signedPayment(accepted) },
    });

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchObject({
      operator: "Reins (operated service)",
      instId: "BTC-USDT",
      last: "84578",
    });
    const paymentResponse = decodePaymentResponseHeader(
      response.headers.get("PAYMENT-RESPONSE") ?? "",
    );
    expect(paymentResponse).toMatchObject({
      success: true,
      transaction: fixtureTransaction,
      network: "eip155:196",
      payer: fixturePayer,
    });
    expect(facilitator.settled).toHaveLength(1);
  });

  it("returns 502 and never settles when every upstream fails", async () => {
    const facilitator = new FakeFacilitator("eip155:196");
    const app = await createApp({
      facilitator,
      pricing: testPricing(),
      fetchUpstream: upstreamDown,
    });
    const accepted = await challenge(app);

    const response = await app.request("/market-data?instId=BTC-USDT", {
      headers: { "PAYMENT-SIGNATURE": signedPayment(accepted) },
    });

    expect(response.status).toBe(502);
    expect(response.headers.get("PAYMENT-RESPONSE")).toBeNull();
    expect(facilitator.verified).toHaveLength(1);
    expect(facilitator.settled).toHaveLength(0);
  });

  it("rejects a payment the facilitator does not verify, without settling or serving data", async () => {
    const facilitator = new FakeFacilitator("eip155:196", false);
    const app = await createApp({
      facilitator,
      pricing: testPricing(),
      fetchUpstream: upstreamAnswers,
    });
    const accepted = await challenge(app);

    const response = await app.request("/market-data?instId=BTC-USDT", {
      headers: { "PAYMENT-SIGNATURE": signedPayment(accepted) },
    });

    expect(response.status).toBe(402);
    expect(facilitator.settled).toHaveLength(0);
  });

  it("refuses to build when the facilitator does not support the configured network", async () => {
    const facilitator = new FakeFacilitator("eip155:1952");
    await expect(
      createApp({ facilitator, pricing: testPricing(), fetchUpstream: upstreamAnswers }),
    ).rejects.toThrow();
  });

  it("serves /health for free with the operator label and no credential values", async () => {
    const facilitator = new FakeFacilitator("eip155:196");
    const app = await createApp({
      facilitator,
      pricing: testPricing(),
      fetchUpstream: upstreamAnswers,
    });

    const response = await app.request("/health");
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({
      service: "reins-paid-service",
      operator: "Reins (operated service)",
      network: "eip155:196",
      payTo: "0x10eb4e5303af6bc785dbea34052298fa9f652d87",
      price: "0.01",
      priceAtomic: "10000",
      asset: { symbol: "USDT0", address: "0x779ded0c9e1022225f8e0630b35a9b54be713736" },
      facilitatorConfigured: true,
    });
    expect(facilitator.verified).toHaveLength(0);
  });
});
