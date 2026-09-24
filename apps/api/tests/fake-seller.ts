import { Server } from "node:http";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { decodeSignedAuthorization, encodeJson } from "../src/payments/x402";
import { usdt0Address, xLayerNetwork } from "../src/payments/xlayer";
import type { FakeChain } from "./fake-chain";

export const sellerPayTo = "0x10eb4e5303af6bc785dbea34052298fa9f652d87";
export const deliverable = "NVDA last trade 131.26 (fixture from the test seller)";

export type SellerMode = "settle" | "unconfirmed" | "hang" | "reject" | "fail";

export interface SellerTerms {
  readonly amount: string;
  readonly network: string;
  readonly asset: string;
  readonly scheme: string;
}

export const defaultTerms: SellerTerms = {
  amount: "400000",
  network: xLayerNetwork,
  asset: usdt0Address,
  scheme: "exact",
};

export interface FakeSeller {
  readonly url: string;
  readonly signaturesReceived: () => number;
  readonly close: () => Promise<void>;
}

export async function startSeller(
  chain: FakeChain,
  mode: SellerMode,
  terms: SellerTerms = defaultTerms,
): Promise<FakeSeller> {
  let received = 0;
  let url = "";
  const app = new Hono().get("/data", async (c) => {
    const signature = c.req.header("PAYMENT-SIGNATURE");
    if (signature === undefined) {
      const challenge = encodeJson({
        x402Version: 2,
        resource: { url, mimeType: "text/plain" },
        accepts: [{ ...terms, payTo: sellerPayTo, maxTimeoutSeconds: 60, extra: {} }],
      });
      return c.body(null, 402, { "PAYMENT-REQUIRED": challenge });
    }
    received += 1;
    const authorization = decodeSignedAuthorization(signature);
    if (authorization === null || mode === "reject") {
      return c.body(null, 402, {
        "PAYMENT-RESPONSE": encodeJson({
          success: false,
          transaction: "",
          network: xLayerNetwork,
          errorReason: "invalid_signature",
        }),
      });
    }
    if (mode === "hang") {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }
    if (mode === "fail") {
      return c.text("facilitator unavailable", 503);
    }
    const txHash = `0x${authorization.nonce.slice(2).split("").reverse().join("")}`;
    const receipt = encodeJson({
      success: true,
      transaction: txHash,
      network: xLayerNetwork,
      payer: authorization.from,
    });
    if (mode === "unconfirmed") {
      return c.text(deliverable, 200, { "PAYMENT-RESPONSE": receipt });
    }
    chain.receipts.set(txHash, {
      status: "SUCCESS",
      transfers: [
        { from: authorization.from, to: authorization.to, value: BigInt(authorization.value) },
      ],
    });
    chain.useAuthorization(authorization.from, authorization.nonce, txHash);
    return c.text(deliverable, 200, { "PAYMENT-RESPONSE": receipt });
  });
  const server = await new Promise<Server>((resolve, reject) => {
    const started = serve({ fetch: app.fetch, port: 0, hostname: "127.0.0.1" }, () => {
      if (started instanceof Server) {
        resolve(started);
      } else {
        reject(new Error("The fake seller did not start an HTTP/1 server"));
      }
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The fake seller has no TCP address");
  }
  url = `http://127.0.0.1:${String(address.port)}/data`;
  return {
    url,
    signaturesReceived: () => received,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          resolve();
        });
      }),
  };
}
