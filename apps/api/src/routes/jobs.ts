import { Hono } from "hono";
import { apiRoutes } from "@reins/core";
import type { Db } from "../db/client";
import { pathId, readBody } from "../http/input";
import { attachAgentSchema, createJobSchema } from "../http/schemas";
import { attachAgent } from "../services/agents";
import { createJob, jobDetail, listJobs } from "../services/jobs";
import { evidence, ledger } from "../services/ledger";

export function jobRoutes(db: Db) {
  return new Hono()
    .get(apiRoutes.jobs, async (c) => c.json(await listJobs(db)))
    .post(apiRoutes.jobs, async (c) =>
      c.json(await createJob(db, await readBody(c, createJobSchema)), 201),
    )
    .get(apiRoutes.job(":id"), async (c) => c.json(await jobDetail(db, pathId(c, "Job"))))
    .post(apiRoutes.agents(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      return c.json(await attachAgent(db, jobId, await readBody(c, attachAgentSchema)), 201);
    })
    .get(apiRoutes.ledger(":id"), async (c) => c.json(await ledger(db, pathId(c, "Job"))))
    .get(apiRoutes.evidence(":id"), async (c) => c.json(await evidence(db, pathId(c, "Job"))));
}
