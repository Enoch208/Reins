import type { LedgerEntryView, SpendResponse } from "@reins/core";
import { describe, expect, it } from "vitest";
import {
  accounting,
  approvedId,
  attachAgent,
  budgetOf,
  call,
  createJob,
  expectInvariant,
  spend,
  resetDatabaseBetweenTests,
} from "./support";

resetDatabaseBetweenTests();

async function activeJobWithAgent(overrides: Parameters<typeof createJob>[0] = {}) {
  const job = await createJob(overrides);
  const agent = await attachAgent(job.id);
  return { job, agent };
}

describe("POST /jobs/:id/spend", () => {
  it("approves a request and reserves capacity before payment", async () => {
    const { job, agent } = await activeJobWithAgent();
    const reply = await spend(job.id, { agentId: agent.id, operationId: "nvda-market-data" });
    expect(reply.status).toBe(200);
    expect(reply.body).toMatchObject({
      decision: "APPROVED",
      state: "RESERVED",
      reserved: "0.40",
      remainingCapacity: "0.60",
      replayed: false,
    });
    expect(await budgetOf(job.id)).toEqual({
      maxBudget: "1.00",
      settled: "0.00",
      reserved: "0.40",
      unresolved: "0.00",
      available: "0.60",
    });
  });

  it("proof 2: the same operationId twice returns the same authorization and reserves once", async () => {
    const { job, agent } = await activeJobWithAgent();
    const first = await spend(job.id, { agentId: agent.id, operationId: "retry-me" });
    const second = await spend(job.id, { agentId: agent.id, operationId: "retry-me" });
    expect(second.body).toEqual({
      decision: "APPROVED",
      authorizationId: approvedId(first),
      state: "RESERVED",
      reserved: "0.40",
      remainingCapacity: "0.60",
      replayed: true,
    });
    const books = await accounting(job.id);
    expect(books.reservedSum).toBe(400_000);
    expect(books.committedCounter).toBe(400_000);
  });

  it("proof 9: expired jobs reject spending", async () => {
    const { job, agent } = await activeJobWithAgent({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const reply = await spend(job.id, { agentId: agent.id });
    expect(reply.body).toEqual({
      decision: "DENIED",
      reason: "JOB_EXPIRED",
      remainingCapacity: "1.00",
    });
  });

  it("proof 10: disallowed services are rejected", async () => {
    const { job, agent } = await activeJobWithAgent();
    const reply = await spend(job.id, { agentId: agent.id, service: "image-generation" });
    expect(reply.body).toMatchObject({ decision: "DENIED", reason: "SERVICE_NOT_ALLOWED" });
  });

  it("proof 11: per-purchase limits are enforced, exactly the limit is allowed", async () => {
    const { job, agent } = await activeJobWithAgent();
    const over = await spend(job.id, { agentId: agent.id, amount: "0.500001" });
    expect(over.body).toMatchObject({ decision: "DENIED", reason: "PER_PURCHASE_LIMIT_EXCEEDED" });
    const exact = await spend(job.id, { agentId: agent.id, amount: "0.50" });
    expect(exact.body).toMatchObject({ decision: "APPROVED", remainingCapacity: "0.50" });
  });

  it("denies agents from another job and unknown agent ids", async () => {
    const { job } = await activeJobWithAgent();
    const other = await activeJobWithAgent();
    const foreign = await spend(job.id, { agentId: other.agent.id });
    expect(foreign.body).toMatchObject({ decision: "DENIED", reason: "AGENT_NOT_IN_JOB" });
    const unknown = await spend(job.id, { agentId: "research-agent-2" });
    expect(unknown.body).toMatchObject({ decision: "DENIED", reason: "AGENT_NOT_IN_JOB" });
  });

  it("denies when the remaining budget is insufficient", async () => {
    const { job, agent } = await activeJobWithAgent();
    await spend(job.id, { agentId: agent.id, amount: "0.50" });
    await spend(job.id, { agentId: agent.id, amount: "0.40" });
    const reply = await spend(job.id, { agentId: agent.id, amount: "0.20" });
    expect(reply.body).toEqual({
      decision: "DENIED",
      reason: "JOB_BUDGET_EXCEEDED",
      remainingCapacity: "0.10",
    });
    await expectInvariant(job.id);
  });

  it("rejects invalid spend bodies with 400 and unknown jobs with 404", async () => {
    const { job, agent } = await activeJobWithAgent();
    for (const amount of ["-0.40", "0", "0.0000001", "abc"]) {
      expect((await spend(job.id, { agentId: agent.id, amount })).status).toBe(400);
    }
    expect((await spend(crypto.randomUUID(), { agentId: agent.id })).status).toBe(404);
  });

  it("writes every decision, including denials, to the ledger newest first", async () => {
    const { job, agent } = await activeJobWithAgent();
    const approved = await spend(job.id, { agentId: agent.id, operationId: "op-approved" });
    await spend(job.id, { agentId: agent.id, operationId: "op-denied", service: "nope" });
    const reply = await call<LedgerEntryView[]>("GET", `/jobs/${job.id}/ledger`);
    expect(reply.status).toBe(200);
    expect(reply.body.map((entry) => entry.operationId)).toEqual(["op-denied", "op-approved"]);
    expect(reply.body[0]).toMatchObject({
      decision: "DENIED",
      denialReason: "SERVICE_NOT_ALLOWED",
      agentId: agent.id,
      agentName: agent.name,
      parentAgentId: null,
      amount: "0.40",
      availableAtDecision: "0.60",
      authorization: null,
    });
    expect(reply.body[1]).toMatchObject({
      decision: "APPROVED",
      denialReason: null,
      availableAtDecision: "1.00",
      authorization: { id: approvedId(approved), state: "RESERVED", amount: "0.40" },
    });
  });
});

describe("scene 4: the demo case", () => {
  it("budget 1.00, three concurrent 0.40 requests: two approved, one denied, 0.20 left", async () => {
    const job = await createJob({ maxBudget: "1.00", maxPerPurchase: "0.50" });
    const team = await Promise.all(
      ["ResearchAgent", "VerificationAgent", "SynthesisAgent"].map((name) =>
        attachAgent(job.id, name),
      ),
    );
    const replies = await Promise.all(
      team.map((agent) => spend(job.id, { agentId: agent.id, amount: "0.40" })),
    );
    const decisions = replies.map((reply) => reply.body);
    const approved = decisions.filter((body) => body.decision === "APPROVED");
    const denied = decisions.filter(
      (body): body is Extract<SpendResponse, { decision: "DENIED" }> => body.decision === "DENIED",
    );
    expect(approved).toHaveLength(2);
    expect(denied).toHaveLength(1);
    expect(denied[0]?.reason).toBe("JOB_BUDGET_EXCEEDED");
    expect(await budgetOf(job.id)).toEqual({
      maxBudget: "1.00",
      settled: "0.00",
      reserved: "0.80",
      unresolved: "0.00",
      available: "0.20",
    });
    const books = await expectInvariant(job.id);
    expect(books.committedCounter).toBe(800_000);
  });
});
