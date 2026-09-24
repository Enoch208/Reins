import { and, eq } from "drizzle-orm";
import type { AgentView, AttachAgentBody, DelegateBody, ReplaceBody } from "@reins/core";
import type { AgentRow, Db, Executor, JobRow } from "../db/client";
import { agents } from "../db/schema";
import { illegalState, notFound } from "../http/errors";
import { toAgentView } from "../views/entities";
import { findJob } from "./jobs";

async function findActiveJob(db: Executor, jobId: string): Promise<JobRow> {
  const job = await findJob(db, jobId);
  if (job.status !== "ACTIVE") {
    throw illegalState("JOB_NOT_ACTIVE", `Job ${jobId} is ${job.status}`);
  }
  return job;
}

export async function findAgentInJob(
  db: Executor,
  jobId: string,
  agentId: string,
): Promise<AgentRow> {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.jobId, jobId)));
  if (agent === undefined) {
    throw notFound("Agent", agentId);
  }
  return agent;
}

async function insertAgent(db: Executor, values: typeof agents.$inferInsert): Promise<AgentRow> {
  const [agent] = await db.insert(agents).values(values).returning();
  if (agent === undefined) {
    throw new Error("Inserting an agent returned no row");
  }
  return agent;
}

export async function attachAgent(
  db: Executor,
  jobId: string,
  body: AttachAgentBody,
): Promise<AgentView> {
  await findActiveJob(db, jobId);
  return toAgentView(await insertAgent(db, { jobId, name: body.name, role: body.role }));
}

export async function delegateAgent(
  db: Executor,
  jobId: string,
  body: DelegateBody,
): Promise<AgentView> {
  const job = await findActiveJob(db, jobId);
  if (!job.delegationAllowed) {
    throw illegalState("DELEGATION_NOT_ALLOWED", `Job ${jobId} does not allow delegation`);
  }
  const parent = await findAgentInJob(db, jobId, body.parentAgentId);
  if (parent.status !== "ACTIVE") {
    throw illegalState("AGENT_NOT_ACTIVE", `Parent agent ${parent.id} is ${parent.status}`);
  }
  return toAgentView(
    await insertAgent(db, { jobId, name: body.name, role: body.role, parentAgentId: parent.id }),
  );
}

export async function replaceAgent(db: Db, jobId: string, body: ReplaceBody): Promise<AgentView> {
  return db.transaction(async (tx) => {
    await findActiveJob(tx, jobId);
    const [replaced] = await tx
      .update(agents)
      .set({ status: "REPLACED" })
      .where(and(eq(agents.id, body.agentId), eq(agents.jobId, jobId), eq(agents.status, "ACTIVE")))
      .returning();
    if (replaced === undefined) {
      const existing = await findAgentInJob(tx, jobId, body.agentId);
      throw illegalState("AGENT_NOT_ACTIVE", `Agent ${existing.id} is ${existing.status}`);
    }
    return toAgentView(
      await insertAgent(tx, {
        jobId,
        name: body.name,
        role: replaced.role,
        parentAgentId: replaced.parentAgentId,
        replacesAgentId: replaced.id,
      }),
    );
  });
}
