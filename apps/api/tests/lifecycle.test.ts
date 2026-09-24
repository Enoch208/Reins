import type { ApiError } from "@reins/core";
import { describe, expect, it } from "vitest";
import {
  approvedId,
  attachAgent,
  budgetOf,
  call,
  createJob,
  expectInvariant,
  spend,
  transition,
  resetDatabaseBetweenTests,
} from "./support";

resetDatabaseBetweenTests();

const receipt = { txHash: "0xabc123", network: "xlayer", deliverable: "NVDA brief v1" };

async function reservation(amount = "0.40") {
  const job = await createJob();
  const agent = await attachAgent(job.id);
  const id = approvedId(await spend(job.id, { agentId: agent.id, amount }));
  return { job, agent, id };
}

describe("authorization lifecycle", () => {
  it("settles a reservation: committed becomes settled and evidence is stored", async () => {
    const { job, id } = await reservation();
    const reply = await transition(id, "settle", receipt);
    expect(reply.status).toBe(200);
    expect(reply.body).toMatchObject({ id, state: "SETTLED", ...receipt, amount: "0.40" });
    expect(reply.body.resolvedAt).not.toBeNull();
    expect(await budgetOf(job.id)).toEqual({
      maxBudget: "1.00",
      settled: "0.40",
      reserved: "0.00",
      unresolved: "0.00",
      available: "0.60",
    });
    await expectInvariant(job.id);
  });

  it("proof 5: a definitive failure releases capacity", async () => {
    const { job, id } = await reservation();
    const reply = await transition(id, "release", { reason: "provider returned 402 twice" });
    expect(reply.body).toMatchObject({
      state: "RELEASED",
      resolutionReason: "provider returned 402 twice",
    });
    expect((await budgetOf(job.id)).available).toBe("1.00");
    await expectInvariant(job.id);
  });

  it("proof 3: a timeout does not release budget", async () => {
    const { job, agent, id } = await reservation("0.50");
    const reply = await transition(id, "unresolved", { reason: "provider timeout" });
    expect(reply.body).toMatchObject({
      state: "UNRESOLVED",
      resolvedAt: null,
      resolutionReason: "provider timeout",
    });
    expect(await budgetOf(job.id)).toMatchObject({
      reserved: "0.00",
      unresolved: "0.50",
      available: "0.50",
    });
    await spend(job.id, { agentId: agent.id, amount: "0.50" });
    const denied = await spend(job.id, { agentId: agent.id, amount: "0.01" });
    expect(denied.body).toMatchObject({ decision: "DENIED", reason: "JOB_BUDGET_EXCEEDED" });
    await expectInvariant(job.id);
  });

  it("proof 4: reconciliation settles an unresolved authorization correctly", async () => {
    const { job, id } = await reservation();
    await transition(id, "unresolved", { reason: "receipt lookup unavailable" });
    const reply = await transition(id, "reconcile", {
      outcome: "SETTLED",
      txHash: "0xfeed",
      network: "xlayer",
    });
    expect(reply.body).toMatchObject({ state: "SETTLED", txHash: "0xfeed", network: "xlayer" });
    expect(await budgetOf(job.id)).toMatchObject({
      settled: "0.40",
      unresolved: "0.00",
      available: "0.60",
    });
    await expectInvariant(job.id);
  });

  it("reconciliation can release an unresolved authorization", async () => {
    const { job, id } = await reservation();
    await transition(id, "unresolved", { reason: "dropped response" });
    const reply = await transition(id, "reconcile", {
      outcome: "RELEASED",
      txHash: null,
      network: null,
    });
    expect(reply.body.state).toBe("RELEASED");
    expect((await budgetOf(job.id)).available).toBe("1.00");
    await expectInvariant(job.id);
  });

  it("returns 409 for every illegal transition and leaves counters untouched", async () => {
    const { job, id } = await reservation();
    const reconcileReserved = await transition(id, "reconcile", {
      outcome: "RELEASED",
      txHash: null,
      network: null,
    });
    expect(reconcileReserved.status).toBe(409);
    await transition(id, "settle", receipt);
    for (const [action, payload] of [
      ["settle", receipt],
      ["release", { reason: "late" }],
      ["unresolved", { reason: "late" }],
      ["reconcile", { outcome: "RELEASED", txHash: null, network: null }],
    ] as const) {
      const reply = await call<ApiError>("POST", `/authorizations/${id}/${action}`, payload);
      expect(reply.status).toBe(409);
      expect(reply.body.error).toBe("ILLEGAL_TRANSITION");
    }
    expect(await budgetOf(job.id)).toMatchObject({ settled: "0.40", available: "0.60" });
    await expectInvariant(job.id);
  });

  it("validates transition bodies and unknown authorization ids", async () => {
    const { id } = await reservation();
    const missingHash = await transition(id, "reconcile", {
      outcome: "SETTLED",
      txHash: null,
      network: null,
    });
    expect(missingHash.status).toBe(400);
    expect((await transition(id, "settle", { txHash: "0x1" })).status).toBe(400);
    expect((await transition(crypto.randomUUID(), "release", { reason: "x" })).status).toBe(404);
  });

  it("a replay after settlement reports the current state without reserving again", async () => {
    const job = await createJob();
    const agent = await attachAgent(job.id);
    const first = await spend(job.id, { agentId: agent.id, operationId: "op-1" });
    await transition(approvedId(first), "settle", receipt);
    const retry = await spend(job.id, { agentId: agent.id, operationId: "op-1" });
    expect(retry.body).toMatchObject({
      decision: "APPROVED",
      authorizationId: approvedId(first),
      state: "SETTLED",
      replayed: true,
      remainingCapacity: "0.60",
    });
    await expectInvariant(job.id);
  });
});
