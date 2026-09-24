import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { loadEnv } from "./env";
import { livePayments, startReconcileLoop } from "./payments/live";

const env = loadEnv(process.env);
const db = createDb(env.DATABASE_URL);
const payments = livePayments(env);
const app = createApp(db, payments);
startReconcileLoop(db, payments.chain);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  process.stdout.write(`Reins API listening on http://localhost:${String(info.port)}\n`);
});
