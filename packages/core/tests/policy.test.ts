import { describe, expect, it } from "vitest";
import { policyChecks } from "../src/contract";
import { evaluatePolicy, type PolicyInput } from "../src/policy";

const now = new Date("2026-09-23T12:00:00.000Z");

function input(overrides: {
  job?: Partial<PolicyInput["job"]>;
  agent?: PolicyInput["agent"];
  request?: Partial<PolicyInput["request"]>;
  now?: Date;
}): PolicyInput {
  return {
    job: {
      id: "job-1",
      status: "ACTIVE",
      expiresAt: new Date("2026-09-24T12:00:00.000Z"),
      allowedServices: ["market-data"],
      maxPerPurchaseMicros: 500_000,
      availableMicros: 1_000_000,
      ...overrides.job,
    },
    agent: overrides.agent === undefined ? { jobId: "job-1", status: "ACTIVE" } : overrides.agent,
    request: { service: "market-data", amountMicros: 400_000, ...overrides.request },
    now: overrides.now ?? now,
  };
}

describe("evaluatePolicy", () => {
  it("allows a request that passes every check", () => {
    const request = input({});
    expect(evaluatePolicy(request)).toEqual({ allowed: true, agent: request.agent });
  });

  it.each([
    ["JOB_NOT_ACTIVE", input({ job: { status: "REVOKED" } })],
    ["JOB_NOT_ACTIVE", input({ job: { status: "COMPLETED" } })],
    ["JOB_EXPIRED", input({ job: { expiresAt: now } })],
    ["SERVICE_NOT_ALLOWED", input({ request: { service: "image-gen" } })],
    ["PER_PURCHASE_LIMIT_EXCEEDED", input({ request: { amountMicros: 500_001 } })],
    ["AGENT_NOT_IN_JOB", input({ agent: null })],
    ["AGENT_NOT_IN_JOB", input({ agent: { jobId: "job-2", status: "ACTIVE" } })],
    ["AGENT_REVOKED", input({ agent: { jobId: "job-1", status: "REVOKED" } })],
    ["AGENT_REVOKED", input({ agent: { jobId: "job-1", status: "REPLACED" } })],
    ["JOB_BUDGET_EXCEEDED", input({ job: { availableMicros: 399_999 } })],
  ])("denies with %s", (reason, request) => {
    expect(evaluatePolicy(request)).toEqual({ allowed: false, reason });
  });

  it("allows spending exactly the per-purchase limit and exactly the remaining capacity", () => {
    const request = input({
      job: { availableMicros: 500_000 },
      request: { amountMicros: 500_000 },
    });
    expect(evaluatePolicy(request).allowed).toBe(true);
  });

  it("reports the first failing check in contract order when everything fails", () => {
    const everythingWrong = input({
      job: { status: "REVOKED", expiresAt: new Date(0), availableMicros: 0 },
      agent: { jobId: "job-2", status: "REVOKED" },
      request: { service: "nope", amountMicros: 9_000_000 },
    });
    expect(evaluatePolicy(everythingWrong)).toEqual({ allowed: false, reason: "JOB_NOT_ACTIVE" });
  });

  it("peels failures off one at a time in exactly the order of policyChecks", () => {
    const observed: string[] = [];
    const fixes: ((value: PolicyInput) => PolicyInput)[] = [
      (value) => ({ ...value, job: { ...value.job, status: "ACTIVE" } }),
      (value) => ({ ...value, job: { ...value.job, expiresAt: new Date("2027-01-01") } }),
      (value) => ({ ...value, request: { ...value.request, service: "market-data" } }),
      (value) => ({ ...value, request: { ...value.request, amountMicros: 400_000 } }),
      (value) => ({ ...value, agent: { jobId: "job-1", status: "REVOKED" } }),
      (value) => ({ ...value, agent: { jobId: "job-1", status: "ACTIVE" } }),
      (value) => ({ ...value, job: { ...value.job, availableMicros: 1_000_000 } }),
    ];
    let current = input({
      job: { status: "REVOKED", expiresAt: new Date(0), availableMicros: 0 },
      agent: null,
      request: { service: "nope", amountMicros: 9_000_000 },
    });
    for (const fix of fixes) {
      const result = evaluatePolicy(current);
      if (!result.allowed) {
        observed.push(result.reason);
      }
      current = fix(current);
    }
    expect(observed).toEqual(policyChecks.map((check) => check.reason));
    expect(evaluatePolicy(current).allowed).toBe(true);
  });
});
