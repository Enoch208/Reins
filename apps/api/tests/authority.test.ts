import type {
  AgentView,
  ApiError,
  EvidenceView,
  JobDetailView,
  LedgerEntryView,
} from "@reins/core";
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

describe("delegation", () => {
  it("proof 6: delegated agents share the parent's job budget", async () => {
    const job = await createJob();
    const parent = await attachAgent(job.id, "ResearchCoordinator");
    const child = await call<AgentView>("POST", `/jobs/${job.id}/delegate`, {
      parentAgentId: parent.id,
      name: "ResearchAgent",
      role: "research",
    });
    expect(child.status).toBe(201);
    expect(child.body).toMatchObject({ parentAgentId: parent.id, jobId: job.id, status: "ACTIVE" });
    const grandchild = await call<AgentView>("POST", `/jobs/${job.id}/delegate`, {
      parentAgentId: child.body.id,
      name: "VerificationAgent",
      role: "verification",
    });
    await spend(job.id, { agentId: parent.id, amount: "0.40" });
    await spend(job.id, { agentId: child.body.id, amount: "0.40" });
    const denied = await spend(job.id, { agentId: grandchild.body.id, amount: "0.40" });
    expect(denied.body).toMatchObject({ decision: "DENIED", reason: "JOB_BUDGET_EXCEEDED" });
    const allowed = await spend(job.id, { agentId: grandchild.body.id, amount: "0.20" });
    expect(allowed.body).toMatchObject({ decision: "APPROVED", remainingCapacity: "0.00" });
    const ledger = await call<LedgerEntryView[]>("GET", `/jobs/${job.id}/ledger`);
    expect(ledger.body[0]).toMatchObject({
      agentName: "VerificationAgent",
      parentAgentId: child.body.id,
    });
    await expectInvariant(job.id);
  });

  it("refuses delegation when the job forbids it or the parent is not active", async () => {
    const closed = await createJob({ delegationAllowed: false });
    const lead = await attachAgent(closed.id);
    const forbidden = await call<ApiError>("POST", `/jobs/${closed.id}/delegate`, {
      parentAgentId: lead.id,
      name: "Child",
      role: "research",
    });
    expect(forbidden).toMatchObject({ status: 409, body: { error: "DELEGATION_NOT_ALLOWED" } });
    const open = await createJob();
    const parent = await attachAgent(open.id);
    await call("POST", `/jobs/${open.id}/revoke`, { agentId: parent.id });
    const revokedParent = await call<ApiError>("POST", `/jobs/${open.id}/delegate`, {
      parentAgentId: parent.id,
      name: "Child",
      role: "research",
    });
    expect(revokedParent.status).toBe(409);
    const foreignParent = await call<ApiError>("POST", `/jobs/${open.id}/delegate`, {
      parentAgentId: lead.id,
      name: "Child",
      role: "research",
    });
    expect(foreignParent.status).toBe(404);
  });
});

describe("replacement", () => {
  it("proof 7: a replacement worker inherits the remaining budget and history", async () => {
    const job = await createJob();
    const original = await attachAgent(job.id, "ResearchAgent-A");
    const first = await spend(job.id, { agentId: original.id, amount: "0.30" });
    await transition(approvedId(first), "settle", {
      txHash: "0x1",
      network: "xlayer",
      deliverable: null,
    });
    await spend(job.id, { agentId: original.id, amount: "0.30" });
    const reply = await call<AgentView>("POST", `/jobs/${job.id}/replace`, {
      agentId: original.id,
      name: "ResearchAgent-B",
    });
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({ replacesAgentId: original.id, role: original.role });
    expect(await budgetOf(job.id)).toMatchObject({
      settled: "0.30",
      reserved: "0.30",
      available: "0.40",
    });
    const oldAgent = await spend(job.id, { agentId: original.id, amount: "0.10" });
    expect(oldAgent.body).toMatchObject({ decision: "DENIED", reason: "AGENT_REVOKED" });
    const over = await spend(job.id, { agentId: reply.body.id, amount: "0.41" });
    expect(over.body).toMatchObject({ decision: "DENIED", reason: "JOB_BUDGET_EXCEEDED" });
    const fits = await spend(job.id, { agentId: reply.body.id, amount: "0.40" });
    expect(fits.body).toMatchObject({ decision: "APPROVED", remainingCapacity: "0.00" });
    const detail = await call<JobDetailView>("GET", `/jobs/${job.id}`);
    expect(detail.body.agents.map((agent) => agent.status)).toEqual(["REPLACED", "ACTIVE"]);
    const again = await call<ApiError>("POST", `/jobs/${job.id}/replace`, {
      agentId: original.id,
      name: "ResearchAgent-C",
    });
    expect(again.status).toBe(409);
    await expectInvariant(job.id);
  });
});

describe("revocation", () => {
  it("proof 8: a revoked job rejects new requests and keeps existing reservations", async () => {
    const job = await createJob();
    const agent = await attachAgent(job.id);
    const held = await spend(job.id, { agentId: agent.id, amount: "0.20" });
    const reply = await call<JobDetailView>("POST", `/jobs/${job.id}/revoke`, { agentId: null });
    expect(reply.status).toBe(200);
    expect(reply.body.job.status).toBe("REVOKED");
    expect(reply.body.job.revokedAt).not.toBeNull();
    expect(reply.body.job.budget).toMatchObject({ reserved: "0.20", available: "0.80" });
    const denied = await spend(job.id, { agentId: agent.id, amount: "0.10" });
    expect(denied.body).toMatchObject({ decision: "DENIED", reason: "JOB_NOT_ACTIVE" });
    const settled = await transition(approvedId(held), "settle", {
      txHash: "0x2",
      network: "xlayer",
      deliverable: null,
    });
    expect(settled.body.state).toBe("SETTLED");
    expect(await budgetOf(job.id)).toMatchObject({ settled: "0.20", reserved: "0.00" });
    const twice = await call<ApiError>("POST", `/jobs/${job.id}/revoke`, { agentId: null });
    expect(twice.status).toBe(409);
    const attach = await call<ApiError>("POST", `/jobs/${job.id}/agents`, { name: "x", role: "y" });
    expect(attach.status).toBe(409);
    await expectInvariant(job.id);
  });

  it("revoking one agent blocks only that agent", async () => {
    const job = await createJob();
    const rogue = await attachAgent(job.id, "Rogue");
    const steady = await attachAgent(job.id, "Steady");
    const reply = await call<JobDetailView>("POST", `/jobs/${job.id}/revoke`, {
      agentId: rogue.id,
    });
    expect(reply.body.agents.find((agent) => agent.id === rogue.id)?.status).toBe("REVOKED");
    expect((await spend(job.id, { agentId: rogue.id })).body).toMatchObject({
      reason: "AGENT_REVOKED",
    });
    expect((await spend(job.id, { agentId: steady.id })).body.decision).toBe("APPROVED");
  });

  it("serves the evidence chain for a job", async () => {
    const job = await createJob();
    const agent = await attachAgent(job.id);
    await spend(job.id, { agentId: agent.id });
    const reply = await call<EvidenceView>("GET", `/jobs/${job.id}/evidence`);
    expect(reply.status).toBe(200);
    expect(reply.body.job.id).toBe(job.id);
    expect(reply.body.agents).toHaveLength(1);
    expect(reply.body.entries).toHaveLength(1);
  });
});
