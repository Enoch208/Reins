import type { Db } from "../db/client";
import type { Env } from "../env";
import type { ChainReader } from "./chain";
import { execFileRunner } from "./cli";
import type { PaymentDeps } from "./deps";
import { OnchainosExecutor } from "./executor";
import { messageOf } from "./probe";
import { reconcilePayments } from "./reconcile";
import { createXLayerReader } from "./xlayer-reader";

const reconcileIntervalMs = 15_000;

export function livePayments(env: Env): PaymentDeps {
  const cli = execFileRunner(env.ONCHAINOS_BIN, env.PAYMENT_TIMEOUT_MS);
  return {
    cli,
    executor: new OnchainosExecutor(cli),
    chain: createXLayerReader(env.XLAYER_RPC_URL),
    timeoutMs: env.PAYMENT_TIMEOUT_MS,
  };
}

export function startReconcileLoop(db: Db, chain: ChainReader): void {
  const tick = async () => {
    try {
      await reconcilePayments(db, chain, new Date());
    } catch (error) {
      process.stderr.write(`Payment reconciliation failed: ${messageOf(error)}\n`);
    }
    setTimeout(() => void tick(), reconcileIntervalMs).unref();
  };
  setTimeout(() => void tick(), reconcileIntervalMs).unref();
}
