import { Hono } from "hono";
import { apiRoutes } from "@reins/core";
import type { Db } from "../db/client";
import { pathId, readBody } from "../http/input";
import { delegateSchema, replaceSchema, revokeSchema, spendSchema } from "../http/schemas";
import { delegateAgent, replaceAgent } from "../services/agents";
import { revoke } from "../services/revoke";
import { requestSpend } from "../services/spend";

export function authorityRoutes(db: Db) {
  return new Hono()
    .post(apiRoutes.spend(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      const body = await readBody(c, spendSchema);
      return c.json(await requestSpend(db, jobId, body, new Date()));
    })
    .post(apiRoutes.delegate(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      return c.json(await delegateAgent(db, jobId, await readBody(c, delegateSchema)), 201);
    })
    .post(apiRoutes.replace(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      return c.json(await replaceAgent(db, jobId, await readBody(c, replaceSchema)), 201);
    })
    .post(apiRoutes.revoke(":id"), async (c) => {
      const jobId = pathId(c, "Job");
      return c.json(await revoke(db, jobId, await readBody(c, revokeSchema)));
    });
}
