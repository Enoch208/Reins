import { isOverviewView, type ActivityEntryView, type OverviewView } from "@reins/core";
import { describe, expect, it } from "vitest";
import {
  approvedId,
  attachAgent,
  call,
  createJob,
  resetDatabaseBetweenTests,
  spend,
  transition,
} from "./support";

resetDatabaseBetweenTests();

async function seed() {
  const job = await createJob({ title: "ACME brief", maxBudget: "1.00" });
  const agent = await attachAgent(job.id);
  const settledId = approvedId(await spend(job.id, { agentId: agent.id, amount: "0.40" }));
  await transition(settledId, "settle", {
    txHash: "0xabc",
    network: "eip155:196",
    deliverable: "brief",
  });
  approvedId(await spend(job.id, { agentId: agent.id, amount: "0.30", service: "verification" }));
  await spend(job.id, { agentId: agent.id, amount: "0.40" });
  await spend(job.id, { agentId: agent.id, amount: "0.10", service: "unlisted" });
  const revoked = await createJob({ title: "Old job", revenue: null, maxBudget: "2.00" });
  await call("POST", `/jobs/${revoked.id}/revoke`, { agentId: null });
  return job;
}

describe("overview and activity", () => {
  it("summarises active budget, decisions, denials and spend by service", async () => {
    await seed();
    const reply = await call<OverviewView>("GET", "/overview");
    expect(reply.status).toBe(200);
    expect(isOverviewView(reply.body)).toBe(true);
    expect(reply.body.jobs).toEqual({ total: 2, active: 1, revoked: 1, completed: 0 });
    expect(reply.body.activeBudget).toEqual({
      maxBudget: "1.00",
      settled: "0.40",
      reserved: "0.30",
      unresolved: "0.00",
      available: "0.30",
    });
    expect(reply.body.settledAllTime).toBe("0.40");
    expect(reply.body.revenue).toBe("5.00");
    expect(reply.body.decisions).toEqual({ approved: 2, denied: 2 });
    expect(reply.body.denialsByReason).toEqual(
      expect.arrayContaining([
        { reason: "JOB_BUDGET_EXCEEDED", count: 1 },
        { reason: "SERVICE_NOT_ALLOWED", count: 1 },
      ]),
    );
    expect(reply.body.spendByService).toEqual([
      { service: "market-data", settled: "0.40", committed: "0.00", purchases: 1 },
      { service: "verification", settled: "0.00", committed: "0.30", purchases: 1 },
    ]);
    expect(reply.body.recent).toHaveLength(4);
    expect(reply.body.recent[0]?.jobTitle).toBe("ACME brief");
  });

  it("returns an empty overview with zeroed totals", async () => {
    const reply = await call<OverviewView>("GET", "/overview");
    expect(isOverviewView(reply.body)).toBe(true);
    expect(reply.body.activeBudget.available).toBe("0.00");
    expect(reply.body.recent).toEqual([]);
  });

  it("lists activity across jobs newest first with the job title", async () => {
    await seed();
    const reply = await call<ActivityEntryView[]>("GET", "/activity");
    expect(reply.status).toBe(200);
    expect(reply.body).toHaveLength(4);
    const times = reply.body.map((entry) => Date.parse(entry.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(reply.body.every((entry) => entry.jobTitle === "ACME brief")).toBe(true);
  });
});
