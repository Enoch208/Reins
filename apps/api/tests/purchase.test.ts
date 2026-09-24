import { count } from "drizzle-orm";
import { isApiError, type ApiError } from "@reins/core";
import { describe, expect, it } from "vitest";
import { authorizations, spendRequests } from "../src/db/schema";
import { payerAddress } from "./fake-cli";
import { defaultTerms, deliverable, sellerPayTo } from "./fake-seller";
import {
  authorizationRow,
  closeSellersAfterEach,
  expectApproved,
  purchase,
  purchaseSetup,
  seller,
} from "./payment-support";
import {
  budgetOf,
  call,
  db,
  expectInvariant,
  fakeCli,
  resetDatabaseBetweenTests,
  spend,
} from "./support";

resetDatabaseBetweenTests();
closeSellersAfterEach();

async function rowCounts() {
  const [auths] = await db.select({ n: count() }).from(authorizations);
  const [requests] = await db.select({ n: count() }).from(spendRequests);
  return { authorizations: auths?.n, spendRequests: requests?.n };
}

describe("purchase through a real x402 challenge", () => {
  it("reserves the quoted price, pays, confirms on-chain and settles with the deliverable", async () => {
    const shop = await seller("settle");
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved).toMatchObject({
      replayed: false,
      outcome: "SETTLED",
      remainingCapacity: "0.60",
      deliverable,
    });
    expect(approved.authorization).toMatchObject({
      state: "SETTLED",
      amount: "0.40",
      network: "eip155:196",
    });
    expect(approved.authorization.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    const row = await authorizationRow(approved.authorization.id);
    expect(row).toMatchObject({ payer: payerAddress, payTo: sellerPayTo, paymentUrl: shop.url });
    expect(row.paymentNonce).toMatch(/^0x[0-9a-f]{64}$/);
    expect(row.validBefore?.getTime()).toBeGreaterThan(Date.now());
    expect(shop.signaturesReceived()).toBe(1);
    const books = await expectInvariant(job.id);
    expect(books.settledSum).toBe(400_000);
  });

  it("replays an operation without signing or paying twice", async () => {
    const shop = await seller("settle");
    const { job, agent } = await purchaseSetup();
    const body = { agentId: agent.id, url: shop.url, operationId: "brief-quote-1" };
    const first = expectApproved(await purchase(job.id, body));
    const second = expectApproved(await purchase(job.id, body));
    expect(second).toMatchObject({ replayed: true, outcome: "SETTLED", deliverable });
    expect(second.authorization.id).toBe(first.authorization.id);
    expect(fakeCli.signCalls).toBe(1);
    expect(shop.signaturesReceived()).toBe(1);
    expect((await budgetOf(job.id)).settled).toBe("0.40");
    await expectInvariant(job.id);
  });

  it("denies a price above the remaining job budget before anything is signed", async () => {
    const shop = await seller("settle");
    const { job, agent } = await purchaseSetup({ maxBudget: "0.30" });
    const reply = await purchase(job.id, { agentId: agent.id, url: shop.url });
    expect(reply.body).toEqual({
      decision: "DENIED",
      reason: "JOB_BUDGET_EXCEEDED",
      remainingCapacity: "0.30",
    });
    expect(fakeCli.signCalls).toBe(0);
    expect(shop.signaturesReceived()).toBe(0);
    await expectInvariant(job.id);
  });

  it("applies the per-purchase cap to the quoted price", async () => {
    const shop = await seller("settle");
    const { job, agent } = await purchaseSetup({ maxPerPurchase: "0.30" });
    const reply = await purchase(job.id, { agentId: agent.id, url: shop.url });
    expect(reply.body).toMatchObject({ decision: "DENIED", reason: "PER_PURCHASE_LIMIT_EXCEEDED" });
    expect(fakeCli.signCalls).toBe(0);
  });

  it.each([
    ["a price above maxAmount", defaultTerms, "0.39", /exceeds maxAmount 0.39/],
    ["another network", { ...defaultTerms, network: "eip155:1952" }, "0.50", /no exact USDT0/],
    [
      "another asset",
      { ...defaultTerms, asset: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d" },
      "0.50",
      /no exact USDT0/,
    ],
    ["another scheme", { ...defaultTerms, scheme: "upto" }, "0.50", /no exact USDT0/],
  ])("rejects %s without reserving anything", async (_label, terms, maxAmount, message) => {
    const shop = await seller("settle", terms);
    const { job, agent } = await purchaseSetup();
    const reply = await purchase(job.id, { agentId: agent.id, url: shop.url, maxAmount });
    expect(reply.status).toBe(422);
    const error: unknown = reply.body;
    if (!isApiError(error)) {
      throw new Error("Expected an API error body");
    }
    expect(error.error).toBe("PAYMENT_TERMS_REJECTED");
    expect(error.message).toMatch(message);
    expect(await rowCounts()).toEqual({ authorizations: 0, spendRequests: 0 });
    expect(fakeCli.signCalls).toBe(0);
  });

  it("releases the reservation with the reason when signing fails", async () => {
    const shop = await seller("settle");
    fakeCli.signMode = { kind: "fail", error: "insufficient USDT0 balance" };
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved.outcome).toBe("RELEASED");
    expect(approved.authorization.resolutionReason).toMatch(/insufficient USDT0 balance/);
    expect(shop.signaturesReceived()).toBe(0);
    expect((await budgetOf(job.id)).available).toBe("1.00");
    await expectInvariant(job.id);
  });

  it("releases when the signed authorization could never be delivered", async () => {
    const shop = await seller("settle");
    fakeCli.beforeSign = () => shop.close();
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved.outcome).toBe("RELEASED");
    expect(approved.authorization.resolutionReason).toMatch(/never delivered/);
    expect((await budgetOf(job.id)).available).toBe("1.00");
    await expectInvariant(job.id);
  });

  it("keeps a timed-out payment UNRESOLVED and still counting against the budget", async () => {
    const shop = await seller("hang");
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved.outcome).toBe("UNRESOLVED");
    expect(approved.authorization.resolutionReason).toMatch(/did not answer within 1000 ms/);
    expect(await budgetOf(job.id)).toMatchObject({ unresolved: "0.40", available: "0.60" });
    const fits = await spend(job.id, { agentId: agent.id, amount: "0.40" });
    expect(fits.body).toMatchObject({ decision: "APPROVED", remainingCapacity: "0.20" });
    const over = await spend(job.id, { agentId: agent.id, amount: "0.21" });
    expect(over.body).toMatchObject({ decision: "DENIED", reason: "JOB_BUDGET_EXCEEDED" });
    await expectInvariant(job.id);
  });

  it.each([
    ["rejects the signature", "reject", /answered 402.*invalid_signature/],
    ["fails with a 5xx", "fail", /answered 503/],
  ] as const)("holds the capacity UNRESOLVED when the seller %s", async (_label, mode, reason) => {
    const shop = await seller(mode);
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved.outcome).toBe("UNRESOLVED");
    expect(approved.authorization.resolutionReason).toMatch(reason);
    expect((await budgetOf(job.id)).unresolved).toBe("0.40");
    await expectInvariant(job.id);
  });

  it("keeps the tx hash and stays UNRESOLVED while the receipt is not on-chain", async () => {
    const shop = await seller("unconfirmed");
    const { job, agent } = await purchaseSetup();
    const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
    expect(approved.outcome).toBe("UNRESOLVED");
    expect(approved.authorization.txHash).toMatch(/^0x/);
    expect(approved.authorization.resolutionReason).toMatch(/NOT_FOUND/);
    await expectInvariant(job.id);
  });

  it("scene 4 with real payments: three concurrent 0.40 purchases on 1.00 settle two", async () => {
    const shop = await seller("settle");
    const { job, agent } = await purchaseSetup();
    const replies = await Promise.all(
      [1, 2, 3].map(() => purchase(job.id, { agentId: agent.id, url: shop.url })),
    );
    const decisions = replies.map((reply) => reply.body.decision).sort();
    expect(decisions).toEqual(["APPROVED", "APPROVED", "DENIED"]);
    expect(shop.signaturesReceived()).toBe(2);
    expect(await budgetOf(job.id)).toMatchObject({ settled: "0.80", available: "0.20" });
    await expectInvariant(job.id);
  });

  it("validates the body and the url", async () => {
    const { job, agent } = await purchaseSetup();
    const reply = await call<ApiError>("POST", `/jobs/${job.id}/purchase`, {
      agentId: agent.id,
      service: "market-data",
      operationId: "op",
      url: "ftp://example.com/data",
      maxAmount: "0.50",
    });
    expect(reply.status).toBe(400);
    expect(reply.body.error).toBe("VALIDATION_FAILED");
  });
});
