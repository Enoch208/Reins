import { describe, expect, it } from "vitest";
import { isArrayOf, isAuthorizationView, isJobView, isSpendResponse } from "../src/guards";

const budget = {
  maxBudget: "1.00",
  settled: "0.00",
  reserved: "0.40",
  unresolved: "0.00",
  available: "0.60",
};

const job = {
  id: "job-1",
  title: "Competitor intelligence",
  customer: "ACME",
  revenue: "5.00",
  currency: "USDT",
  maxPerPurchase: "0.50",
  allowedServices: ["market-data"],
  expiresAt: "2026-09-23T20:00:00.000Z",
  delegationAllowed: true,
  status: "ACTIVE",
  isDemoData: true,
  createdAt: "2026-09-23T19:00:00.000Z",
  revokedAt: null,
  budget,
};

const authorization = {
  id: "auth-1",
  jobId: "job-1",
  agentId: "agent-1",
  operationId: "op-1",
  service: "market-data",
  amount: "0.40",
  state: "RELEASED",
  txHash: null,
  network: null,
  deliverable: null,
  resolutionReason: "provider returned 402 twice",
  createdAt: "2026-09-23T19:00:00.000Z",
  resolvedAt: "2026-09-23T19:01:00.000Z",
};

describe("response guards", () => {
  it("accepts views shaped exactly like the API returns them", () => {
    expect(isJobView(job)).toBe(true);
    expect(isArrayOf(isJobView)([job, job])).toBe(true);
    expect(isAuthorizationView(authorization)).toBe(true);
  });

  it("rejects a view with a malformed amount or an unknown status", () => {
    expect(isJobView({ ...job, maxPerPurchase: "0.5000001" })).toBe(false);
    expect(isJobView({ ...job, status: "PAUSED" })).toBe(false);
    expect(isJobView({ ...job, budget: { ...budget, available: -1 } })).toBe(false);
  });

  it("requires the resolution reason field on authorizations", () => {
    const withoutReason = Object.fromEntries(
      Object.entries(authorization).filter(([key]) => key !== "resolutionReason"),
    );
    expect(isAuthorizationView(withoutReason)).toBe(false);
  });

  it("tells approved and denied spend responses apart", () => {
    const approved = {
      decision: "APPROVED",
      authorizationId: "auth-1",
      state: "RESERVED",
      reserved: "0.40",
      remainingCapacity: "0.60",
      replayed: false,
    };
    const denied = { decision: "DENIED", reason: "JOB_BUDGET_EXCEEDED", remainingCapacity: "0.20" };
    expect(isSpendResponse(approved)).toBe(true);
    expect(isSpendResponse(denied)).toBe(true);
    expect(isSpendResponse({ ...approved, replayed: "no" })).toBe(false);
    expect(isSpendResponse({ ...denied, reason: "BECAUSE" })).toBe(false);
  });
});
