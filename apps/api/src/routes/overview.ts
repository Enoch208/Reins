import { Hono } from "hono";
import { apiRoutes } from "@reins/core";
import type { Db } from "../db/client";
import { activity } from "../services/activity";
import { overview } from "../services/overview";

const activityLimit = 100;

export function overviewRoutes(db: Db) {
  return new Hono()
    .get(apiRoutes.overview, async (c) => c.json(await overview(db)))
    .get(apiRoutes.activity, async (c) => c.json(await activity(db, activityLimit)));
}
