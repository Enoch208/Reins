import type { ApiError, JobDetailView, JobView } from "@reins/core";
import { describe, expect, it } from "vitest";
import { app, attachAgent, call, createJob, jobBody, resetDatabaseBetweenTests } from "./support";

resetDatabaseBetweenTests();

describe("jobs", () => {
  it("creates a job and returns the contract view with decimal strings", async () => {
    const reply = await call<JobView>("POST", "/jobs", jobBody({ isDemoData: true }));
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({
      title: "NVDA market brief",
      customer: "Acme Research",
      revenue: "5.00",
      currency: "USDT",
      maxPerPurchase: "0.50",
      allowedServices: ["market-data", "verification"],
      delegationAllowed: true,
      status: "ACTIVE",
      isDemoData: true,
      revokedAt: null,
      budget: {
        maxBudget: "1.00",
        settled: "0.00",
        reserved: "0.00",
        unresolved: "0.00",
        available: "1.00",
      },
    });
    expect(new Date(reply.body.createdAt).toISOString()).toBe(reply.body.createdAt);
  });

  it("lists jobs newest first", async () => {
    const first = await createJob({ title: "first" });
    const second = await createJob({ title: "second" });
    const reply = await call<JobView[]>("GET", "/jobs");
    expect(reply.status).toBe(200);
    expect(reply.body.map((job) => job.id)).toEqual([second.id, first.id]);
  });

  it("returns job detail with its agents", async () => {
    const job = await createJob();
    const agent = await attachAgent(job.id);
    const reply = await call<JobDetailView>("GET", `/jobs/${job.id}`);
    expect(reply.status).toBe(200);
    expect(reply.body.job.id).toBe(job.id);
    expect(reply.body.agents).toEqual([agent]);
    expect(agent).toMatchObject({ jobId: job.id, parentAgentId: null, status: "ACTIVE" });
  });

  it.each([
    ["a negative budget", { maxBudget: "-1" }],
    ["too many decimals", { maxBudget: "0.1234567" }],
    ["a zero per-purchase limit", { maxPerPurchase: "0" }],
    ["a junk amount", { maxBudget: "one dollar" }],
    ["an invalid expiry", { expiresAt: "tomorrow" }],
    ["no allowed services", { allowedServices: [] }],
  ])("rejects %s with 400", async (_label, overrides) => {
    const reply = await call<ApiError>("POST", "/jobs", { ...jobBody(), ...overrides });
    expect(reply.status).toBe(400);
    expect(reply.body.error).toBe("VALIDATION_FAILED");
  });

  it("rejects unknown fields and malformed JSON with 400", async () => {
    const extra = await call<ApiError>("POST", "/jobs", { ...jobBody(), agentBudget: "1.00" });
    expect(extra.status).toBe(400);
    const response = await app.request("/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 for unknown and malformed ids and unknown routes", async () => {
    const unknown = await call<ApiError>("GET", `/jobs/${crypto.randomUUID()}`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error).toBe("NOT_FOUND");
    expect((await call<ApiError>("GET", "/jobs/not-a-uuid")).status).toBe(404);
    expect((await call<ApiError>("GET", "/nowhere")).status).toBe(404);
  });

  it("keeps the health check", async () => {
    const reply = await call<{ status: string }>("GET", "/health");
    expect(reply).toEqual({ status: 200, body: { status: "ok" } });
  });
});
