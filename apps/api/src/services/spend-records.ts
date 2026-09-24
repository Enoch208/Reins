import { and, eq } from "drizzle-orm";
import { formatMicros, type DenialReason, type SpendApproved, type SpendDenied } from "@reins/core";
import type { AgentRow, AuthorizationRow, Executor, JobRow, Tx } from "../db/client";
import { authorizations, spendRequests } from "../db/schema";
import type { SpendInput } from "../http/schemas";
import { availableFromCounters } from "../views/budget";

export async function findAuthorization(
  db: Executor,
  jobId: string,
  operationId: string,
): Promise<AuthorizationRow | null> {
  const [authorization] = await db
    .select()
    .from(authorizations)
    .where(and(eq(authorizations.jobId, jobId), eq(authorizations.operationId, operationId)));
  return authorization ?? null;
}

export function replayed(authorization: AuthorizationRow, job: JobRow): SpendApproved {
  return {
    decision: "APPROVED",
    authorizationId: authorization.id,
    state: authorization.state,
    reserved: formatMicros(authorization.amountMicros),
    remainingCapacity: formatMicros(availableFromCounters(job)),
    replayed: true,
  };
}

export async function recordDenial(
  tx: Tx,
  job: JobRow,
  agent: AgentRow | null,
  input: SpendInput,
  reason: DenialReason,
): Promise<SpendDenied> {
  const available = availableFromCounters(job);
  await tx.insert(spendRequests).values({
    jobId: job.id,
    agentId: agent === null ? null : agent.id,
    operationId: input.operationId,
    service: input.service,
    amountMicros: input.amount,
    decision: "DENIED",
    denialReason: reason,
    availableMicros: available,
  });
  return { decision: "DENIED", reason, remainingCapacity: formatMicros(available) };
}

export async function recordApproval(
  tx: Tx,
  authorization: AuthorizationRow,
  availableBefore: number,
): Promise<SpendApproved> {
  await tx.insert(spendRequests).values({
    jobId: authorization.jobId,
    agentId: authorization.agentId,
    operationId: authorization.operationId,
    service: authorization.service,
    amountMicros: authorization.amountMicros,
    decision: "APPROVED",
    availableMicros: availableBefore,
    authorizationId: authorization.id,
  });
  return {
    decision: "APPROVED",
    authorizationId: authorization.id,
    state: authorization.state,
    reserved: formatMicros(authorization.amountMicros),
    remainingCapacity: formatMicros(availableBefore - authorization.amountMicros),
    replayed: false,
  };
}
