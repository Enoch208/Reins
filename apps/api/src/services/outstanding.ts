import { and, inArray, sql } from "drizzle-orm";
import type { Executor } from "../db/client";
import { authorizations } from "../db/schema";
import type { OutstandingMicros } from "../views/budget";

export async function outstandingByJob(
  db: Executor,
  jobIds: readonly string[],
): Promise<Map<string, OutstandingMicros>> {
  const totals = new Map<string, OutstandingMicros>();
  if (jobIds.length === 0) {
    return totals;
  }
  const rows = await db
    .select({
      jobId: authorizations.jobId,
      reservedMicros:
        sql`coalesce(sum(${authorizations.amountMicros}) filter (where ${authorizations.state} = 'RESERVED'), 0)::bigint`.mapWith(
          Number,
        ),
      unresolvedMicros:
        sql`coalesce(sum(${authorizations.amountMicros}) filter (where ${authorizations.state} = 'UNRESOLVED'), 0)::bigint`.mapWith(
          Number,
        ),
    })
    .from(authorizations)
    .where(
      and(
        inArray(authorizations.jobId, [...jobIds]),
        inArray(authorizations.state, ["RESERVED", "UNRESOLVED"]),
      ),
    )
    .groupBy(authorizations.jobId);
  for (const row of rows) {
    totals.set(row.jobId, {
      reservedMicros: row.reservedMicros,
      unresolvedMicros: row.unresolvedMicros,
    });
  }
  return totals;
}

export async function outstandingForJob(db: Executor, jobId: string): Promise<OutstandingMicros> {
  const totals = await outstandingByJob(db, [jobId]);
  return totals.get(jobId) ?? { reservedMicros: 0, unresolvedMicros: 0 };
}
