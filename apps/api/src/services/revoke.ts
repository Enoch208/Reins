import { and, eq } from "drizzle-orm";
import type { JobDetailView, RevokeBody } from "@reins/core";
import type { Db, Tx } from "../db/client";
import { agents, jobs } from "../db/schema";
import { illegalState } from "../http/errors";
import { findAgentInJob } from "./agents";
import { findJob, jobDetail } from "./jobs";

async function revokeJob(tx: Tx, jobId: string, now: Date): Promise<void> {
  const revoked = await tx
    .update(jobs)
    .set({ status: "REVOKED", revokedAt: now })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "ACTIVE")))
    .returning({ id: jobs.id });
  if (revoked.length === 0) {
    const job = await findJob(tx, jobId);
    throw illegalState("JOB_NOT_ACTIVE", `Job ${jobId} is ${job.status}`);
  }
}

async function revokeAgent(tx: Tx, jobId: string, agentId: string, now: Date): Promise<void> {
  await findJob(tx, jobId);
  const revoked = await tx
    .update(agents)
    .set({ status: "REVOKED", revokedAt: now })
    .where(and(eq(agents.id, agentId), eq(agents.jobId, jobId), eq(agents.status, "ACTIVE")))
    .returning({ id: agents.id });
  if (revoked.length === 0) {
    const agent = await findAgentInJob(tx, jobId, agentId);
    throw illegalState("AGENT_NOT_ACTIVE", `Agent ${agentId} is ${agent.status}`);
  }
}

export async function revoke(db: Db, jobId: string, body: RevokeBody): Promise<JobDetailView> {
  const now = new Date();
  await db.transaction(async (tx) => {
    if (body.agentId === null) {
      await revokeJob(tx, jobId, now);
    } else {
      await revokeAgent(tx, jobId, body.agentId, now);
    }
  });
  return jobDetail(db, jobId);
}
