import { desc, eq, sql } from "drizzle-orm";
import { formatMicros, type DenialCount, type OverviewView, type ServiceSpend } from "@reins/core";
import type { Executor, JobRow } from "../db/client";
import { authorizations, jobs, spendRequests } from "../db/schema";
import { budgetFromMicros } from "../views/budget";
import { activity } from "./activity";
import { outstandingByJob } from "./outstanding";

const recentLimit = 12;

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

async function activeBudget(db: Executor, active: readonly JobRow[]) {
  const outstanding = await outstandingByJob(
    db,
    active.map((job) => job.id),
  );
  return budgetFromMicros({
    maxMicros: sum(active.map((job) => job.maxBudgetMicros)),
    settledMicros: sum(active.map((job) => job.settledMicros)),
    reservedMicros: sum(active.map((job) => outstanding.get(job.id)?.reservedMicros ?? 0)),
    unresolvedMicros: sum(active.map((job) => outstanding.get(job.id)?.unresolvedMicros ?? 0)),
  });
}

async function decisionCounts(db: Executor) {
  const rows = await db
    .select({ decision: spendRequests.decision, count: sql<number>`count(*)::int` })
    .from(spendRequests)
    .groupBy(spendRequests.decision);
  const of = (decision: "APPROVED" | "DENIED") =>
    rows.find((row) => row.decision === decision)?.count ?? 0;
  return { approved: of("APPROVED"), denied: of("DENIED") };
}

async function denialsByReason(db: Executor): Promise<DenialCount[]> {
  const rows = await db
    .select({ reason: spendRequests.denialReason, count: sql<number>`count(*)::int` })
    .from(spendRequests)
    .where(eq(spendRequests.decision, "DENIED"))
    .groupBy(spendRequests.denialReason)
    .orderBy(desc(sql`count(*)`));
  return rows.flatMap((row) =>
    row.reason === null ? [] : [{ reason: row.reason, count: row.count }],
  );
}

async function spendByService(db: Executor): Promise<ServiceSpend[]> {
  const settled = sql<number>`coalesce(sum(${authorizations.amountMicros}) filter (where ${authorizations.state} = 'SETTLED'), 0)::bigint`;
  const committed = sql<number>`coalesce(sum(${authorizations.amountMicros}) filter (where ${authorizations.state} in ('RESERVED', 'UNRESOLVED')), 0)::bigint`;
  const rows = await db
    .select({
      service: authorizations.service,
      settled: settled.mapWith(Number),
      committed: committed.mapWith(Number),
      purchases: sql<number>`count(*) filter (where ${authorizations.state} <> 'RELEASED')::int`,
    })
    .from(authorizations)
    .groupBy(authorizations.service)
    .orderBy(desc(sql`${settled} + ${committed}`), authorizations.service);
  return rows.map((row) => ({
    service: row.service,
    settled: formatMicros(row.settled),
    committed: formatMicros(row.committed),
    purchases: row.purchases,
  }));
}

export async function overview(db: Executor): Promise<OverviewView> {
  const rows = await db.select().from(jobs);
  const active = rows.filter((job) => job.status === "ACTIVE");
  return {
    jobs: {
      total: rows.length,
      active: active.length,
      revoked: rows.filter((job) => job.status === "REVOKED").length,
      completed: rows.filter((job) => job.status === "COMPLETED").length,
    },
    activeBudget: await activeBudget(db, active),
    settledAllTime: formatMicros(sum(rows.map((job) => job.settledMicros))),
    revenue: formatMicros(sum(rows.map((job) => job.revenueMicros ?? 0))),
    decisions: await decisionCounts(db),
    denialsByReason: await denialsByReason(db),
    spendByService: await spendByService(db),
    recent: await activity(db, recentLimit),
  };
}
