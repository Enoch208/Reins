import type { Db } from "../db/client";
import { markUnresolved, release, settle } from "../services/authorizations";
import { confirmsTransfer } from "./chain";
import type { PaymentDeps } from "./deps";
import { recordSignature, recordTxHash } from "./evidence";
import { SigningFailed, type SignedPayment } from "./executor";
import { messageOf } from "./probe";
import { replayWithSignature, type ReplayOutcome } from "./replay";
import { sameAddress, xLayerNetwork } from "./xlayer";
import type { PaymentTerms } from "./x402";

const deliverableLimit = 2000;
const clockSkewSeconds = 300;

function deliverableOf(body: string): string | null {
  if (body.trim() === "") {
    return null;
  }
  return body.length <= deliverableLimit ? body : `${body.slice(0, deliverableLimit - 1)}…`;
}

function assertMatchesTerms(signed: SignedPayment, terms: PaymentTerms, nowSeconds: bigint): void {
  const { to, value, validBefore } = signed.authorization;
  if (!sameAddress(to, terms.payTo)) {
    throw new SigningFailed(`The signature pays ${to}, not the quoted payTo ${terms.payTo}`);
  }
  if (BigInt(value) !== BigInt(terms.amountMicros)) {
    throw new SigningFailed(
      `The signature authorizes ${value}, not the quoted ${String(terms.amountMicros)}`,
    );
  }
  const latest = nowSeconds + BigInt(terms.maxTimeoutSeconds + clockSkewSeconds);
  if (
    BigInt(validBefore) <= nowSeconds - BigInt(clockSkewSeconds) ||
    BigInt(validBefore) > latest
  ) {
    throw new SigningFailed(
      `The signature's validBefore ${validBefore} is outside the quoted window`,
    );
  }
}

async function signOrRelease(
  db: Db,
  deps: PaymentDeps,
  authorizationId: string,
  terms: PaymentTerms,
  url: string,
): Promise<SignedPayment | null> {
  try {
    const head = await deps.chain.head();
    const signed = await deps.executor.sign(terms);
    assertMatchesTerms(signed, terms, head.timestampSeconds);
    await recordSignature(db, authorizationId, {
      url,
      authorization: signed.authorization,
      block: head.number,
    });
    return signed;
  } catch (error) {
    await release(db, authorizationId, { reason: `Payment not signed: ${messageOf(error)}` });
    return null;
  }
}

async function resolveOutcome(
  db: Db,
  deps: PaymentDeps,
  authorizationId: string,
  signed: SignedPayment,
  outcome: ReplayOutcome,
): Promise<void> {
  if (outcome.kind === "UNDELIVERED") {
    await release(db, authorizationId, { reason: outcome.reason });
    return;
  }
  if (outcome.txHash !== null) {
    await recordTxHash(db, authorizationId, outcome.txHash, xLayerNetwork);
  }
  if (outcome.kind === "UNKNOWN") {
    await markUnresolved(db, authorizationId, { reason: outcome.reason });
    return;
  }
  const lookup = await deps.chain.receipt(outcome.txHash);
  const expected = {
    from: signed.authorization.from,
    to: signed.authorization.to,
    amountMicros: Number(signed.authorization.value),
  };
  if (!confirmsTransfer(lookup, expected)) {
    await markUnresolved(db, authorizationId, {
      reason: `Transaction ${outcome.txHash} is not a confirmed matching USDT0 transfer yet (${lookup.status})`,
    });
    return;
  }
  await settle(db, authorizationId, {
    txHash: outcome.txHash,
    network: xLayerNetwork,
    deliverable: deliverableOf(outcome.body),
  });
}

export async function executePayment(
  db: Db,
  deps: PaymentDeps,
  authorizationId: string,
  terms: PaymentTerms,
  url: string,
): Promise<void> {
  const signed = await signOrRelease(db, deps, authorizationId, terms, url);
  if (signed === null) {
    return;
  }
  const outcome = await replayWithSignature(url, signed.paymentSignature, deps.timeoutMs);
  try {
    await resolveOutcome(db, deps, authorizationId, signed, outcome);
  } catch (error) {
    await markUnresolved(db, authorizationId, {
      reason: `Settlement could not be confirmed: ${messageOf(error)}`,
    });
  }
}
