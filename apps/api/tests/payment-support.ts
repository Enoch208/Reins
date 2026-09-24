import { eq } from "drizzle-orm";
import {
  isPurchaseResponse,
  type CreateJobBody,
  type PurchaseApproved,
  type PurchaseRequestBody,
  type PurchaseResponse,
} from "@reins/core";
import { afterEach, expect } from "vitest";
import type { AuthorizationRow } from "../src/db/client";
import { authorizations } from "../src/db/schema";
import { startSeller, type FakeSeller, type SellerMode, type SellerTerms } from "./fake-seller";
import { attachAgent, call, createJob, db, fakeChain, type Reply } from "./support";

const running: FakeSeller[] = [];

export function closeSellersAfterEach(): void {
  afterEach(async () => {
    await Promise.all(running.splice(0).map((seller) => seller.close()));
  });
}

export async function seller(mode: SellerMode, terms?: SellerTerms): Promise<FakeSeller> {
  const started = await startSeller(fakeChain, mode, terms);
  running.push(started);
  return started;
}

export async function purchaseSetup(overrides: Partial<CreateJobBody> = {}) {
  const job = await createJob(overrides);
  const agent = await attachAgent(job.id);
  return { job, agent };
}

export async function purchase(
  jobId: string,
  body: Partial<PurchaseRequestBody> & Pick<PurchaseRequestBody, "agentId" | "url">,
): Promise<Reply<PurchaseResponse>> {
  const reply = await call<PurchaseResponse>("POST", `/jobs/${jobId}/purchase`, {
    service: "market-data",
    operationId: crypto.randomUUID(),
    maxAmount: "0.50",
    ...body,
  });
  if (reply.status === 200) {
    expect(isPurchaseResponse(reply.body)).toBe(true);
  }
  return reply;
}

export function expectApproved(reply: Reply<PurchaseResponse>): PurchaseApproved {
  expect(reply.status).toBe(200);
  if (reply.body.decision !== "APPROVED") {
    throw new Error(`Expected an approval, got ${reply.body.reason}`);
  }
  return reply.body;
}

export async function authorizationRow(id: string): Promise<AuthorizationRow> {
  const [row] = await db.select().from(authorizations).where(eq(authorizations.id, id));
  if (row === undefined) {
    throw new Error(`Authorization ${id} is missing`);
  }
  return row;
}
