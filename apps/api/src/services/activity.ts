import { desc, eq } from "drizzle-orm";
import type { ActivityEntryView } from "@reins/core";
import type { Executor } from "../db/client";
import { agents, authorizations, jobs, spendRequests } from "../db/schema";
import { toLedgerEntryView } from "../views/ledger";

export async function activity(db: Executor, limit: number): Promise<ActivityEntryView[]> {
  const rows = await db
    .select({
      request: spendRequests,
      agent: agents,
      authorization: authorizations,
      jobTitle: jobs.title,
    })
    .from(spendRequests)
    .innerJoin(jobs, eq(spendRequests.jobId, jobs.id))
    .leftJoin(agents, eq(spendRequests.agentId, agents.id))
    .leftJoin(authorizations, eq(spendRequests.authorizationId, authorizations.id))
    .orderBy(desc(spendRequests.createdAt), desc(spendRequests.id))
    .limit(limit);
  return rows.map((row) => ({ ...toLedgerEntryView(row), jobTitle: row.jobTitle }));
}
