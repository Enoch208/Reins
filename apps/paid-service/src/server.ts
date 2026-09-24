import { serve } from "@hono/node-server";
import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { createApp } from "./app";
import { loadEnv } from "./env";
import { dnsCheckedFetch } from "./market/dns-checked-fetch";
import { operatorLabel } from "./operator";

function refuseToStart(lines: readonly string[]): never {
  process.stderr.write(
    `Reins paid service refused to start.\n${lines.map((line) => `  - ${line}`).join("\n")}\n`,
  );
  process.exit(1);
}

const loaded = loadEnv(process.env);
if (!loaded.ok) {
  refuseToStart([
    ...loaded.problems,
    "It never serves unpaid data or fakes a payment; set the OKX facilitator credentials in apps/paid-service/.env.",
  ]);
}
const { env } = loaded;

const facilitator = new OKXFacilitatorClient({ ...env.credentials, syncSettle: true });

const app = await createApp({
  facilitator,
  pricing: env.pricing,
  fetchUpstream: dnsCheckedFetch,
}).catch((error: unknown) =>
  refuseToStart([
    `The OKX facilitator could not confirm exact payments on ${env.pricing.network}.`,
    error instanceof Error
      ? `${error.message}${error.cause instanceof Error ? ` (${error.cause.message})` : ""}`
      : String(error),
  ]),
);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  process.stdout.write(
    `${operatorLabel} listening on http://localhost:${String(info.port)} (${env.pricing.network}, ${env.pricing.price} USDT0 to ${env.pricing.payTo})\n`,
  );
});
