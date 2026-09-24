import { Hono } from "hono";
import { apiRoutes } from "@reins/core";
import type { Db } from "../db/client";
import { pathId, readBody } from "../http/input";
import {
  markUnresolvedSchema,
  reconcileSchema,
  releaseSchema,
  settleSchema,
} from "../http/schemas";
import { markUnresolved, reconcile, release, settle } from "../services/authorizations";

export function authorizationRoutes(db: Db) {
  return new Hono()
    .post(apiRoutes.settle(":id"), async (c) => {
      const id = pathId(c, "Authorization");
      return c.json(await settle(db, id, await readBody(c, settleSchema)));
    })
    .post(apiRoutes.release(":id"), async (c) => {
      const id = pathId(c, "Authorization");
      const input = await readBody(c, releaseSchema);
      return c.json(await release(db, id, input));
    })
    .post(apiRoutes.unresolved(":id"), async (c) => {
      const id = pathId(c, "Authorization");
      const input = await readBody(c, markUnresolvedSchema);
      return c.json(await markUnresolved(db, id, input));
    })
    .post(apiRoutes.reconcile(":id"), async (c) => {
      const id = pathId(c, "Authorization");
      return c.json(await reconcile(db, id, await readBody(c, reconcileSchema)));
    });
}
