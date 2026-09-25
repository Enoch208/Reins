import { ReinsClient } from "./client";
import { EnvError, loadEnv, type Env } from "./env";
import { runScene, writeSummary, type SceneResult } from "./runner";
import { scenes } from "./scenes";
import { purchaseScene } from "./scenes/purchase";
import { stdoutWriter } from "./transcript";

const paidPurchase = purchaseScene(process.env.PAID_SERVICE_URL ?? null);
const runnable = [...scenes, paidPurchase];

function usage(): string {
  const width = Math.max(...runnable.map((scene) => scene.name.length), "all".length);
  const lines = runnable.map((scene) => `  ${scene.name.padEnd(width)}  ${scene.summary}`);
  return [
    "Reins demo agent team: drives each demo scene against a live Reins API and asserts",
    "the outcome. Every scene creates its own fresh job labelled as demo data.",
    "",
    "Usage: pnpm --filter @reins/agents dev -- <scene|all>",
    "",
    "Scenes:",
    ...lines,
    `  ${"all".padEnd(width)}  every scene except purchase, then a summary table`,
    "",
    "Environment: REINS_API_URL     base URL of the Reins API, e.g. http://localhost:8787",
    "             PAID_SERVICE_URL  base URL of the paid service, needed only for purchase",
    "             REINS_OPERATOR_KEY  operator key, when the API requires one",
    "Exit code: 0 when every assertion passes, 1 when any fails, 2 on a usage error.",
    "Payments: only the purchase scene pays, for real, through the OKX Agentic Wallet on",
    "X Layer. It checks the wallet balance and the paid service before spending anything.",
  ].join("\n");
}

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [target] = args;

if (target === undefined || target === "--help" || target === "-h" || args.length > 1) {
  stdoutWriter.line(usage());
  process.exit(target === "--help" || target === "-h" ? 0 : 2);
}

const selected = target === "all" ? scenes : runnable.filter((scene) => scene.name === target);
if (selected.length === 0) {
  stdoutWriter.line(`Unknown scene "${target}".\n`);
  stdoutWriter.line(usage());
  process.exit(2);
}

function loadEnvOrExit(): Env {
  try {
    return loadEnv(process.env);
  } catch (error) {
    if (error instanceof EnvError) {
      stdoutWriter.line(error.message);
      process.exit(2);
    }
    throw error;
  }
}

const env = loadEnvOrExit();
const client = new ReinsClient(env.REINS_API_URL, env.REINS_OPERATOR_KEY ?? null);
stdoutWriter.line(`Reins API: ${env.REINS_API_URL}\n`);

const results: SceneResult[] = [];
for (const scene of selected) {
  results.push(await runScene(scene, client, stdoutWriter));
}
if (target === "all") {
  writeSummary(results, stdoutWriter);
}
process.exit(results.every((result) => result.failures.length === 0) ? 0 : 1);
