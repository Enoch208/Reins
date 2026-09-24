import { and, eq, isNotNull, lt } from "drizzle-orm";
import type { AuthorizationRow, Db } from "../db/client";
import { authorizations } from "../db/schema";
import { HttpError } from "../http/errors";
import { markUnresolved, reconcile } from "../services/authorizations";
import { confirmsTransfer, type ChainHead, type ChainReader } from "./chain";
import { xLayerNetwork } from "./xlayer";

export interface ReconcileSummary {
  readonly settled: number;
  readonly released: number;
  readonly pending: number;
}

type Verdict =
  | { readonly outcome: "SETTLED"; readonly txHash: string | null; readonly reason: string }
  | { readonly outcome: "RELEASED"; readonly reason: string }
  | { readonly outcome: "PENDING" };

interface SignedRow {
  readonly row: AuthorizationRow;
  readonly payer: string;
  readonly payTo: string;
  readonly nonce: string;
  readonly validBefore: Date;
}

const logScanBlocks = 1200n;
const interruptedGraceMs = 60_000;

async function unlessRaced(transition: () => Promise<unknown>): Promise<boolean> {
  try {
    await transition();
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.code === "ILLEGAL_TRANSITION") {
      return false;
    }
    throw error;
  }
}

async function adoptInterrupted(db: Db, now: Date): Promise<void> {
  const stale = await db
    .select({ id: authorizations.id })
    .from(authorizations)
    .where(
      and(
        eq(authorizations.state, "RESERVED"),
        isNotNull(authorizations.paymentNonce),
        lt(authorizations.validBefore, new Date(now.getTime() - interruptedGraceMs)),
      ),
    );
  for (const { id } of stale) {
    await unlessRaced(() =>
      markUnresolved(db, id, {
        reason: "The payment was signed but its outcome was never recorded",
      }),
    );
  }
}

function signed(row: AuthorizationRow): SignedRow | null {
  const { payer, payTo, paymentNonce, validBefore } = row;
  if (payer === null || payTo === null || paymentNonce === null || validBefore === null) {
    return null;
  }
  return { row, payer, payTo, nonce: paymentNonce, validBefore };
}

async function settledByReceipt(chain: ChainReader, payment: SignedRow): Promise<boolean> {
  if (payment.row.txHash === null) {
    return false;
  }
  const lookup = await chain.receipt(payment.row.txHash);
  return confirmsTransfer(lookup, {
    from: payment.payer,
    to: payment.payTo,
    amountMicros: payment.row.amountMicros,
  });
}

async function usageTx(chain: ChainReader, payment: SignedRow, head: ChainHead) {
  if (payment.row.paymentBlock === null) {
    return payment.row.txHash;
  }
  const from = BigInt(payment.row.paymentBlock);
  const to = head.number < from + logScanBlocks ? head.number : from + logScanBlocks;
  const found = await chain.findAuthorizationTx(payment.payer, payment.nonce, from, to);
  return found ?? payment.row.txHash;
}

async function judge(chain: ChainReader, payment: SignedRow): Promise<Verdict> {
  if (await settledByReceipt(chain, payment)) {
    return {
      outcome: "SETTLED",
      txHash: payment.row.txHash,
      reason: "Reconciled: the transaction receipt confirms the USDT0 transfer",
    };
  }
  const head = await chain.head();
  if (await chain.authorizationUsed(payment.payer, payment.nonce, head.number)) {
    return {
      outcome: "SETTLED",
      txHash: await usageTx(chain, payment, head),
      reason: "Reconciled: USDT0 reports the signed authorization as used",
    };
  }
  const validBeforeSeconds = BigInt(Math.floor(payment.validBefore.getTime() / 1000));
  if (head.timestampSeconds >= validBeforeSeconds) {
    return {
      outcome: "RELEASED",
      reason: "Reconciled: the signed authorization expired unused on X Layer",
    };
  }
  return { outcome: "PENDING" };
}

async function apply(db: Db, payment: SignedRow, verdict: Verdict): Promise<boolean> {
  if (verdict.outcome === "PENDING") {
    return false;
  }
  const settledTx = verdict.outcome === "SETTLED" ? verdict.txHash : null;
  return unlessRaced(() =>
    reconcile(
      db,
      payment.row.id,
      {
        outcome: verdict.outcome,
        txHash: settledTx,
        network: verdict.outcome === "SETTLED" ? xLayerNetwork : null,
      },
      verdict.reason,
    ),
  );
}

export async function reconcilePayments(
  db: Db,
  chain: ChainReader,
  now: Date,
): Promise<ReconcileSummary> {
  await adoptInterrupted(db, now);
  const rows = await db
    .select()
    .from(authorizations)
    .where(and(eq(authorizations.state, "UNRESOLVED"), isNotNull(authorizations.paymentNonce)));
  let settled = 0;
  let released = 0;
  let pending = 0;
  for (const payment of rows.flatMap((row) => signed(row) ?? [])) {
    const verdict = await judge(chain, payment);
    const applied = await apply(db, payment, verdict);
    if (applied && verdict.outcome === "SETTLED") {
      settled += 1;
    } else if (applied && verdict.outcome === "RELEASED") {
      released += 1;
    } else {
      pending += 1;
    }
  }
  return { settled, released, pending };
}
