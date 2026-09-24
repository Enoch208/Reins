import type { Scene } from "../scene";
import { concurrencyScene } from "./concurrency";
import { delegationScene } from "./delegation";
import { policyScene } from "./policy";
import { replacementScene } from "./replacement";
import { retryScene } from "./retry";
import { revokeScene } from "./revoke";
import { teamScene } from "./team";
import { timeoutScene } from "./timeout";

export const scenes: readonly Scene[] = [
  teamScene,
  concurrencyScene,
  retryScene,
  delegationScene,
  replacementScene,
  policyScene,
  revokeScene,
  timeoutScene,
];
