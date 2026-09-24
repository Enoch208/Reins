import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { authorizations } from "../src/db/schema";
import { reconcilePayments } from "../src/payments/reconcile";
import { payerAddress } from "./fake-cli";
import { sellerPayTo } from "./fake-seller";
import {
  authorizationRow,
  closeSellersAfterEach,
  expectApproved,
  purchase,
  purchaseSetup,
  seller,
} from "./payment-support";
import {
  approvedId,
  budgetOf,
  db,
  expectInvariant,
  fakeChain,
  resetDatabaseBetweenTests,
  spend,
} from "./support";

resetDatabaseBetweenTests();
closeSellersAfterEach();

async function unresolvedPurchase(mode: "fail" | "unconfirmed" = "fail") {
  const shop = await seller(mode);
  const { job, agent } = await purchaseSetup();
  const approved = expectApproved(await purchase(job.id, { agentId: agent.id, url: shop.url }));
  expect(approved.outcome).toBe("UNRESOLVED");
  const row = await authorizationRow(approved.authorization.id);
  if (row.paymentNonce === null || row.validBefore === null) {
    throw new Error("The signed authorization evidence was not persisted");
  }
  return { job, id: row.id, nonce: row.paymentNonce, validBefore: row.validBefore, row };
}

describe("payment reconciliation against the chain", () => {
  it("settles when USDT0 reports the nonce as used, with the tx from AuthorizationUsed", async () => {
    const { job, id, nonce } = await unresolvedPurchase();
    const txHash = `0x${"ab".repeat(32)}`;
    fakeChain.useAuthorization(payerAddress, nonce, txHash);
    expect(await reconcilePayments(db, fakeChain, new Date())).toEqual({
      settled: 1,
      released: 0,
      pending: 0,
    });
    const row = await authorizationRow(id);
    expect(row).toMatchObject({ state: "SETTLED", txHash, network: "eip155:196" });
    expect(row.resolutionReason).toMatch(/used/);
    expect(await budgetOf(job.id)).toMatchObject({ settled: "0.40", unresolved: "0.00" });
    await expectInvariant(job.id);
  });

  it("settles from a known tx hash once its receipt confirms the transfer", async () => {
    const { job, id, row } = await unresolvedPurchase("unconfirmed");
    if (row.txHash === null) {
      throw new Error("The tx hash was not kept");
    }
    fakeChain.receipts.set(row.txHash, {
      status: "SUCCESS",
      transfers: [{ from: payerAddress, to: sellerPayTo, value: 400_000n }],
    });
    expect((await reconcilePayments(db, fakeChain, new Date())).settled).toBe(1);
    expect(await authorizationRow(id)).toMatchObject({ state: "SETTLED", txHash: row.txHash });
    await expectInvariant(job.id);
  });

  it("does not settle from a receipt whose transfer does not match", async () => {
    const { id, row } = await unresolvedPurchase("unconfirmed");
    if (row.txHash === null) {
      throw new Error("The tx hash was not kept");
    }
    fakeChain.receipts.set(row.txHash, {
      status: "SUCCESS",
      transfers: [{ from: payerAddress, to: sellerPayTo, value: 1n }],
    });
    expect((await reconcilePayments(db, fakeChain, new Date())).pending).toBe(1);
    expect((await authorizationRow(id)).state).toBe("UNRESOLVED");
  });

  it("releases once the chain is past validBefore and the nonce is unused", async () => {
    const { job, id, validBefore } = await unresolvedPurchase();
    fakeChain.timestampSeconds = BigInt(Math.floor(validBefore.getTime() / 1000));
    expect((await reconcilePayments(db, fakeChain, new Date())).released).toBe(1);
    const row = await authorizationRow(id);
    expect(row.state).toBe("RELEASED");
    expect(row.resolutionReason).toMatch(/expired unused/);
    expect((await budgetOf(job.id)).available).toBe("1.00");
    await expectInvariant(job.id);
  });

  it("leaves a still-valid unused authorization UNRESOLVED and counting", async () => {
    const { job, id } = await unresolvedPurchase();
    expect(await reconcilePayments(db, fakeChain, new Date())).toEqual({
      settled: 0,
      released: 0,
      pending: 1,
    });
    expect((await authorizationRow(id)).state).toBe("UNRESOLVED");
    expect((await budgetOf(job.id)).unresolved).toBe("0.40");
    await expectInvariant(job.id);
  });

  it("adopts a signed reservation whose outcome was never recorded", async () => {
    const { job, agent } = await purchaseSetup();
    const id = approvedId(await spend(job.id, { agentId: agent.id }));
    const expired = new Date(Date.now() - 120_000);
    await db
      .update(authorizations)
      .set({
        payer: payerAddress,
        payTo: sellerPayTo,
        paymentNonce: `0x${"cd".repeat(32)}`,
        validBefore: expired,
        paymentBlock: 900,
      })
      .where(eq(authorizations.id, id));
    fakeChain.timestampSeconds = BigInt(Math.floor(Date.now() / 1000));
    expect((await reconcilePayments(db, fakeChain, new Date())).released).toBe(1);
    expect((await authorizationRow(id)).state).toBe("RELEASED");
    await expectInvariant(job.id);
  });
});
