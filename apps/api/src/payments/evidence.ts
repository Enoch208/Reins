import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client";
import { authorizations } from "../db/schema";
import type { SignedAuthorization } from "./x402";

export interface SignedEvidence {
  readonly url: string;
  readonly authorization: SignedAuthorization;
  readonly block: bigint;
}

const openStates = ["RESERVED", "UNRESOLVED"] as const;

export async function recordSignature(
  db: Db,
  authorizationId: string,
  evidence: SignedEvidence,
): Promise<void> {
  const updated = await db
    .update(authorizations)
    .set({
      paymentUrl: evidence.url,
      payer: evidence.authorization.from,
      payTo: evidence.authorization.to,
      paymentNonce: evidence.authorization.nonce,
      validBefore: new Date(Number(evidence.authorization.validBefore) * 1000),
      paymentBlock: Number(evidence.block),
    })
    .where(and(eq(authorizations.id, authorizationId), eq(authorizations.state, "RESERVED")))
    .returning({ id: authorizations.id });
  if (updated.length === 0) {
    throw new Error(`Authorization ${authorizationId} is no longer RESERVED`);
  }
}

export async function recordTxHash(
  db: Db,
  authorizationId: string,
  txHash: string,
  network: string,
): Promise<void> {
  await db
    .update(authorizations)
    .set({ txHash, network })
    .where(and(eq(authorizations.id, authorizationId), inArray(authorizations.state, openStates)));
}
