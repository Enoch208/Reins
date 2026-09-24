import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { ApiError } from "@reins/core";
import type { Db } from "./db/client";
import { HttpError } from "./http/errors";
import { authorityRoutes } from "./routes/authority";
import { authorizationRoutes } from "./routes/authorizations";
import { jobRoutes } from "./routes/jobs";
import { overviewRoutes } from "./routes/overview";
import { paymentRoutes } from "./routes/payments";
import type { PaymentDeps } from "./payments/deps";

export function createApp(db: Db, payments: PaymentDeps) {
  return new Hono()
    .get("/health", async (c) => {
      await db.execute(sql`select 1`);
      return c.json({ status: "ok" });
    })
    .route("/", jobRoutes(db))
    .route("/", authorityRoutes(db))
    .route("/", authorizationRoutes(db))
    .route("/", overviewRoutes(db))
    .route("/", paymentRoutes(db, payments))
    .notFound((c) =>
      c.json<ApiError>(
        { error: "NOT_FOUND", message: `No route for ${c.req.method} ${c.req.path}` },
        404,
      ),
    )
    .onError((error, c) => {
      if (error instanceof HttpError) {
        return c.json(error.toBody(), error.status);
      }
      process.stderr.write(`${error.stack ?? error.message}\n`);
      return c.json<ApiError>({ error: "INTERNAL", message: "Internal server error" }, 500);
    });
}
