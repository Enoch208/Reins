import { desc, eq } from "drizzle-orm";
import type { EvidenceView, LedgerEntryView } from "@reins/core";
import type { Executor } from "../db/client";
import { agents, authorizations, spendRequests } from "../db/schema";
import { toLedgerEntryView } from "../views/ledger";
import { findJob, jobDetail } from "./jobs";

export async function ledger(db: Executor, jobId: string): Promise<LedgerEntryView[]> {
  await findJob(db, jobId);
  const rows = await db
    .select({ request: spendRequests, agent: agents, authorization: authorizations })
    .from(spendRequests)
    .leftJoin(agents, eq(spendRequests.agentId, agents.id))
    .leftJoin(authorizations, eq(spendRequests.authorizationId, authorizations.id))
    .where(eq(spendRequests.jobId, jobId))
    .orderBy(desc(spendRequests.createdAt), desc(spendRequests.id));
  return rows.map(toLedgerEntryView);
}

export async function evidence(db: Executor, jobId: string): Promise<EvidenceView> {
  const detail = await jobDetail(db, jobId);
  const entries = await ledger(db, jobId);
  return { ...detail, entries };
}
