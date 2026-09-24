import type { ChainReader } from "./chain";
import type { CliRunner } from "./cli";
import type { PaymentExecutor } from "./executor";

export interface PaymentDeps {
  readonly executor: PaymentExecutor;
  readonly chain: ChainReader;
  readonly cli: CliRunner;
  readonly timeoutMs: number;
}
