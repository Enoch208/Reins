import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { loadEnv } from "./env";
import { livePayments, startReconcileLoop } from "./payments/live";

const env = loadEnv(process.env);
const db = createDb(env.DATABASE_URL);
const payments = livePayments(env);
const app = createApp(db, payments, {
  operatorKey: env.OPERATOR_KEY ?? null,
  allowedServiceOrigins: env.ALLOWED_SERVICE_ORIGINS ?? null,
});
if (env.OPERATOR_KEY === undefined || env.ALLOWED_SERVICE_ORIGINS === undefined) {
  process.stdout.write(
    "Reins API is running without an operator key or a service allow-list; keep it on a trusted machine\n",
  );
}
startReconcileLoop(db, payments.chain);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  process.stdout.write(`Reins API listening on http://localhost:${String(info.port)}\n`);
});
