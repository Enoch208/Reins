import { eq } from "drizzle-orm";
import {
  formatMicros,
  type AuthorizationState,
  type PaymentOutcome,
  type PurchaseApproved,
  type PurchaseResponse,
} from "@reins/core";
import type { Db } from "../db/client";
import { authorizations } from "../db/schema";
import { notFound } from "../http/errors";
import type { PurchaseInput } from "../http/schemas";
import { findJob } from "../services/jobs";
import { requestSpend } from "../services/spend";
import { findAuthorization } from "../services/spend-records";
import { availableFromCounters } from "../views/budget";
import { toAuthorizationView } from "../views/entities";
import type { PaymentDeps } from "./deps";
import { executePayment } from "./pay";
import { probeTerms } from "./probe";

const outcomes: Record<AuthorizationState, PaymentOutcome> = {
  RESERVED: "UNRESOLVED",
  UNRESOLVED: "UNRESOLVED",
  SETTLED: "SETTLED",
  RELEASED: "RELEASED",
};

async function approved(
  db: Db,
  authorizationId: string,
  replayed: boolean,
): Promise<PurchaseApproved> {
  const [row] = await db
    .select()
    .from(authorizations)
    .where(eq(authorizations.id, authorizationId));
  if (row === undefined) {
    throw notFound("Authorization", authorizationId);
  }
  const job = await findJob(db, row.jobId);
  return {
    decision: "APPROVED",
    replayed,
    outcome: outcomes[row.state],
    authorization: toAuthorizationView(row),
    remainingCapacity: formatMicros(availableFromCounters(job)),
    deliverable: row.deliverable,
  };
}

export async function purchase(
  db: Db,
  deps: PaymentDeps,
  jobId: string,
  input: PurchaseInput,
  now: Date,
): Promise<PurchaseResponse> {
  await findJob(db, jobId);
  const existing = await findAuthorization(db, jobId, input.operationId);
  if (existing !== null) {
    return approved(db, existing.id, true);
  }
  const terms = await probeTerms(input.url, input.maxAmount, deps.timeoutMs);
  const spend = await requestSpend(
    db,
    jobId,
    {
      agentId: input.agentId,
      service: input.service,
      amount: terms.amountMicros,
      operationId: input.operationId,
    },
    now,
  );
  if (spend.decision === "DENIED") {
    return spend;
  }
  if (!spend.replayed) {
    await executePayment(db, deps, spend.authorizationId, terms, input.url);
  }
  return approved(db, spend.authorizationId, spend.replayed);
}
