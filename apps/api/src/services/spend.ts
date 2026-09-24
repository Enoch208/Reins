import { and, eq, sql } from "drizzle-orm";
import { evaluatePolicy, type SpendResponse } from "@reins/core";
import type { AgentRow, Db, JobRow, Tx } from "../db/client";
import { agents, authorizations, jobs } from "../db/schema";
import { isUuid } from "../http/input";
import type { SpendInput } from "../http/schemas";
import { availableFromCounters } from "../views/budget";
import { findJob } from "./jobs";
import { findAuthorization, recordApproval, recordDenial, replayed } from "./spend-records";

class OperationAlreadyAuthorized extends Error {
  constructor(operationId: string) {
    super(`Operation ${operationId} was authorized by a concurrent request`);
    this.name = "OperationAlreadyAuthorized";
  }
}

async function findAgent(tx: Tx, agentId: string): Promise<AgentRow | null> {
  if (!isUuid(agentId)) {
    return null;
  }
  const [agent] = await tx.select().from(agents).where(eq(agents.id, agentId));
  return agent ?? null;
}

async function reserveCapacity(
  tx: Tx,
  jobId: string,
  amountMicros: number,
): Promise<JobRow | null> {
  const [job] = await tx
    .update(jobs)
    .set({ committedMicros: sql`${jobs.committedMicros} + ${amountMicros}::bigint` })
    .where(
      and(
        eq(jobs.id, jobId),
        eq(jobs.status, "ACTIVE"),
        sql`${jobs.settledMicros} + ${jobs.committedMicros} + ${amountMicros}::bigint <= ${jobs.maxBudgetMicros}`,
      ),
    )
    .returning();
  return job ?? null;
}

async function decide(tx: Tx, jobId: string, input: SpendInput, now: Date): Promise<SpendResponse> {
  const job = await findJob(tx, jobId);
  const existing = await findAuthorization(tx, jobId, input.operationId);
  if (existing !== null) {
    return replayed(existing, job);
  }
  const agent = await findAgent(tx, input.agentId);
  const verdict = evaluatePolicy({
    job: { ...job, availableMicros: availableFromCounters(job) },
    agent,
    request: { service: input.service, amountMicros: input.amount },
    now,
  });
  if (!verdict.allowed) {
    return recordDenial(tx, job, agent, input, verdict.reason);
  }
  const reserved = await reserveCapacity(tx, jobId, input.amount);
  if (reserved === null) {
    const fresh = await findJob(tx, jobId);
    return recordDenial(
      tx,
      fresh,
      verdict.agent,
      input,
      fresh.status === "ACTIVE" ? "JOB_BUDGET_EXCEEDED" : "JOB_NOT_ACTIVE",
    );
  }
  const [authorization] = await tx
    .insert(authorizations)
    .values({
      jobId,
      agentId: verdict.agent.id,
      operationId: input.operationId,
      service: input.service,
      amountMicros: input.amount,
    })
    .onConflictDoNothing({ target: [authorizations.jobId, authorizations.operationId] })
    .returning();
  if (authorization === undefined) {
    throw new OperationAlreadyAuthorized(input.operationId);
  }
  return recordApproval(tx, authorization, availableFromCounters(reserved) + input.amount);
}

export async function requestSpend(
  db: Db,
  jobId: string,
  input: SpendInput,
  now: Date,
): Promise<SpendResponse> {
  try {
    return await db.transaction((tx) => decide(tx, jobId, input, now));
  } catch (error) {
    if (!(error instanceof OperationAlreadyAuthorized)) {
      throw error;
    }
    const job = await findJob(db, jobId);
    const winner = await findAuthorization(db, jobId, input.operationId);
    if (winner === null) {
      throw error;
    }
    return replayed(winner, job);
  }
}
