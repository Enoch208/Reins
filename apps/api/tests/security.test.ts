import { isAgentView, isJobView, type AgentView, type JobView } from "@reins/core";
import { describe, expect, it } from "vitest";
import { OnchainosExecutor } from "../src/payments/executor";
import { createApp } from "../src/app";
import { closeSellersAfterEach, seller } from "./payment-support";
import {
  db,
  fakeChain,
  fakeCli,
  jobBody,
  paymentTimeoutMs,
  resetDatabaseBetweenTests,
} from "./support";

resetDatabaseBetweenTests();
closeSellersAfterEach();

const operatorKey = "k".repeat(40);

function securedApp(allowedServiceOrigins: readonly string[] | null) {
  return createApp(
    db,
    {
      executor: new OnchainosExecutor(fakeCli),
      chain: fakeChain,
      cli: fakeCli,
      timeoutMs: paymentTimeoutMs,
    },
    { operatorKey, allowedServiceOrigins },
  );
}

async function send(
  app: ReturnType<typeof securedApp>,
  method: string,
  path: string,
  body: unknown,
  key: string | null,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key !== null) headers.authorization = `Bearer ${key}`;
  const response = await app.request(path, {
    method,
    headers,
    ...(body === null ? {} : { body: JSON.stringify(body) }),
  });
  const json: unknown = await response.json();
  return { status: response.status, body: json };
}

async function created<T extends JobView | AgentView>(
  app: ReturnType<typeof securedApp>,
  path: string,
  body: unknown,
  guard: (value: unknown) => value is T,
): Promise<T> {
  const reply = await send(app, "POST", path, body, operatorKey);
  expect(reply.status).toBe(201);
  if (!guard(reply.body)) throw new Error(`Unexpected response from ${path}`);
  return reply.body;
}

describe("operator key and service allow-list", () => {
  it("refuses changes without the operator key and keeps reads open", async () => {
    const app = securedApp(null);
    const missing = await send(app, "POST", "/jobs", jobBody(), null);
    expect(missing.status).toBe(401);
    expect(missing.body).toMatchObject({ error: "OPERATOR_KEY_REQUIRED" });
    const wrong = await send(app, "POST", "/jobs", jobBody(), "x".repeat(40));
    expect(wrong.status).toBe(401);
    const reads = await send(app, "GET", "/jobs", null, null);
    expect(reads.status).toBe(200);
    const created = await send(app, "POST", "/jobs", jobBody(), operatorKey);
    expect(created.status).toBe(201);
  });

  it("pays only services on the allow-list, before any reservation", async () => {
    const shop = await seller("settle");
    const allowed = new URL(shop.url).origin;
    const strict = securedApp(["https://paid.example.com"]);
    const job = await created(strict, "/jobs", jobBody(), isJobView);
    const agent = await created(
      strict,
      `/jobs/${job.id}/agents`,
      { name: "Buyer", role: "research" },
      isAgentView,
    );
    const request = {
      agentId: agent.id,
      service: "market-data",
      operationId: crypto.randomUUID(),
      url: shop.url,
      maxAmount: "0.50",
    };
    const blocked = await send(strict, "POST", `/jobs/${job.id}/purchase`, request, operatorKey);
    expect(blocked.status).toBe(403);
    expect(blocked.body).toMatchObject({ error: "SERVICE_ORIGIN_NOT_ALLOWED" });
    const ledger = await send(strict, "GET", `/jobs/${job.id}/ledger`, null, null);
    expect(ledger.body).toEqual([]);

    const trusting = securedApp([allowed]);
    const paid = await send(trusting, "POST", `/jobs/${job.id}/purchase`, request, operatorKey);
    expect(paid.status).toBe(200);
    expect(paid.body).toMatchObject({ decision: "APPROVED" });
  });
});
