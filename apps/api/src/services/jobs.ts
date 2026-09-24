import { asc, desc, eq } from "drizzle-orm";
import type { JobDetailView, JobView } from "@reins/core";
import type { Executor, JobRow } from "../db/client";
import { agents, jobs } from "../db/schema";
import { notFound } from "../http/errors";
import type { CreateJobInput } from "../http/schemas";
import { noOutstanding } from "../views/budget";
import { toAgentView, toJobView } from "../views/entities";
import { outstandingByJob, outstandingForJob } from "./outstanding";

export async function createJob(db: Executor, input: CreateJobInput): Promise<JobView> {
  const [job] = await db
    .insert(jobs)
    .values({
      title: input.title,
      customer: input.customer,
      revenueMicros: input.revenue,
      maxBudgetMicros: input.maxBudget,
      maxPerPurchaseMicros: input.maxPerPurchase,
      currency: "USDT",
      allowedServices: input.allowedServices,
      expiresAt: input.expiresAt,
      delegationAllowed: input.delegationAllowed,
      isDemoData: input.isDemoData,
    })
    .returning();
  if (job === undefined) {
    throw new Error("Inserting a job returned no row");
  }
  return toJobView(job, noOutstanding);
}

export async function listJobs(db: Executor): Promise<JobView[]> {
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt), desc(jobs.id));
  const totals = await outstandingByJob(
    db,
    rows.map((job) => job.id),
  );
  return rows.map((job) => toJobView(job, totals.get(job.id) ?? noOutstanding));
}

export async function findJob(db: Executor, jobId: string): Promise<JobRow> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (job === undefined) {
    throw notFound("Job", jobId);
  }
  return job;
}

export async function jobView(db: Executor, jobId: string): Promise<JobView> {
  const job = await findJob(db, jobId);
  return toJobView(job, await outstandingForJob(db, jobId));
}

export async function jobDetail(db: Executor, jobId: string): Promise<JobDetailView> {
  const job = await jobView(db, jobId);
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.jobId, jobId))
    .orderBy(asc(agents.createdAt), asc(agents.id));
  return { job, agents: rows.map(toAgentView) };
}
