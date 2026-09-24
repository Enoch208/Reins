import { eq, sql } from "drizzle-orm";
import type {
  AgentView,
  AuthorizationView,
  CreateJobBody,
  JobDetailView,
  JobView,
  SpendRequestBody,
  SpendResponse,
} from "@reins/core";
import { afterAll, beforeEach, expect } from "vitest";
import { createApp } from "../src/app";
import { createDb } from "../src/db/client";
import { authorizations, jobs } from "../src/db/schema";
import { OnchainosExecutor } from "../src/payments/executor";
import { FakeChain } from "./fake-chain";
import { FakeCli } from "./fake-cli";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || !databaseUrl.endsWith("/reins_test")) {
  throw new Error("API tests must run against the reins_test database");
}

export const db = createDb(databaseUrl);
export const fakeCli = new FakeCli();
export const fakeChain = new FakeChain();
export const paymentTimeoutMs = 1_000;
export const app = createApp(db, {
  executor: new OnchainosExecutor(fakeCli),
  chain: fakeChain,
  cli: fakeCli,
  timeoutMs: paymentTimeoutMs,
});

export function resetDatabaseBetweenTests(): void {
  beforeEach(async () => {
    await db.execute(sql`truncate spend_requests, authorizations, agents, jobs cascade`);
    fakeCli.reset();
    fakeChain.reset();
  });
  afterAll(async () => {
    await db.$client.end();
  });
}

export interface Reply<Body> {
  readonly status: number;
  readonly body: Body;
}

export async function call<Body>(
  method: string,
  path: string,
  payload?: unknown,
): Promise<Reply<Body>> {
  const response = await app.request(path, {
    method,
    headers: { "content-type": "application/json" },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const body: unknown = await response.json();
  return { status: response.status, body: body as Body };
}

export function jobBody(overrides: Partial<CreateJobBody> = {}): CreateJobBody {
  return {
    title: "NVDA market brief",
    customer: "Acme Research",
    revenue: "5.00",
    maxBudget: "1.00",
    maxPerPurchase: "0.50",
    allowedServices: ["market-data", "verification"],
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    delegationAllowed: true,
    isDemoData: false,
    ...overrides,
  };
}

export async function createJob(overrides: Partial<CreateJobBody> = {}): Promise<JobView> {
  const reply = await call<JobView>("POST", "/jobs", jobBody(overrides));
  if (reply.status !== 201) {
    throw new Error(`Creating a job failed with ${String(reply.status)}`);
  }
  return reply.body;
}

export async function attachAgent(jobId: string, name = "ResearchAgent"): Promise<AgentView> {
  const reply = await call<AgentView>("POST", `/jobs/${jobId}/agents`, { name, role: "research" });
  if (reply.status !== 201) {
    throw new Error(`Attaching an agent failed with ${String(reply.status)}`);
  }
  return reply.body;
}

export async function spend(
  jobId: string,
  body: Partial<SpendRequestBody> & Pick<SpendRequestBody, "agentId">,
): Promise<Reply<SpendResponse>> {
  return call<SpendResponse>("POST", `/jobs/${jobId}/spend`, {
    service: "market-data",
    amount: "0.40",
    operationId: crypto.randomUUID(),
    ...body,
  });
}

export function approvedId(reply: Reply<SpendResponse>): string {
  if (reply.body.decision !== "APPROVED") {
    throw new Error(`Expected an approval, got ${reply.body.reason}`);
  }
  return reply.body.authorizationId;
}

export async function transition(
  authorizationId: string,
  action: "settle" | "release" | "unresolved" | "reconcile",
  payload: unknown,
): Promise<Reply<AuthorizationView>> {
  return call<AuthorizationView>("POST", `/authorizations/${authorizationId}/${action}`, payload);
}

export async function budgetOf(jobId: string): Promise<JobView["budget"]> {
  const reply = await call<JobDetailView>("GET", `/jobs/${jobId}`);
  return reply.body.job.budget;
}

export interface Accounting {
  readonly maxBudgetMicros: number;
  readonly settledCounter: number;
  readonly committedCounter: number;
  readonly settledSum: number;
  readonly reservedSum: number;
  readonly unresolvedSum: number;
}

export async function accounting(jobId: string): Promise<Accounting> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (job === undefined) {
    throw new Error(`Job ${jobId} is missing`);
  }
  const rows = await db.select().from(authorizations).where(eq(authorizations.jobId, jobId));
  const sumOf = (state: string) =>
    rows.filter((row) => row.state === state).reduce((total, row) => total + row.amountMicros, 0);
  return {
    maxBudgetMicros: job.maxBudgetMicros,
    settledCounter: job.settledMicros,
    committedCounter: job.committedMicros,
    settledSum: sumOf("SETTLED"),
    reservedSum: sumOf("RESERVED"),
    unresolvedSum: sumOf("UNRESOLVED"),
  };
}

export async function expectInvariant(jobId: string): Promise<Accounting> {
  const books = await accounting(jobId);
  expect(books.settledCounter).toBe(books.settledSum);
  expect(books.committedCounter).toBe(books.reservedSum + books.unresolvedSum);
  expect(books.settledSum + books.reservedSum + books.unresolvedSum).toBeLessThanOrEqual(
    books.maxBudgetMicros,
  );
  return books;
}
