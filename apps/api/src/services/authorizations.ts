import { and, eq, sql } from "drizzle-orm";
import {
  authorizationTransitions,
  counterDelta,
  type AuthorizationTransition,
  type AuthorizationView,
} from "@reins/core";
import type { Db } from "../db/client";
import { authorizations, jobs } from "../db/schema";
import { illegalState, notFound } from "../http/errors";
import type { ReasonInput, ReconcileInput, SettleInput } from "../http/schemas";
import { toAuthorizationView } from "../views/entities";

interface Evidence {
  readonly txHash: string | null;
  readonly network: string | null;
  readonly deliverable: string | null;
  readonly reason: string | null;
}

async function applyTransition(
  db: Db,
  authorizationId: string,
  transition: AuthorizationTransition,
  evidence: Evidence,
): Promise<AuthorizationView> {
  return db.transaction(async (tx) => {
    const resolved = transition.to !== "UNRESOLVED";
    const [authorization] = await tx
      .update(authorizations)
      .set({
        state: transition.to,
        ...(evidence.txHash === null ? {} : { txHash: evidence.txHash }),
        ...(evidence.network === null ? {} : { network: evidence.network }),
        ...(evidence.deliverable === null ? {} : { deliverable: evidence.deliverable }),
        ...(evidence.reason === null ? {} : { resolutionReason: evidence.reason }),
        ...(resolved ? { resolvedAt: new Date() } : {}),
      })
      .where(and(eq(authorizations.id, authorizationId), eq(authorizations.state, transition.from)))
      .returning();
    if (authorization === undefined) {
      const [current] = await tx
        .select({ state: authorizations.state })
        .from(authorizations)
        .where(eq(authorizations.id, authorizationId));
      if (current === undefined) {
        throw notFound("Authorization", authorizationId);
      }
      throw illegalState(
        "ILLEGAL_TRANSITION",
        `Authorization ${authorizationId} is ${current.state} and cannot move to ${transition.to}`,
      );
    }
    const delta = counterDelta(transition, authorization.amountMicros);
    if (delta.settledMicros !== 0 || delta.committedMicros !== 0) {
      await tx
        .update(jobs)
        .set({
          settledMicros: sql`${jobs.settledMicros} + ${delta.settledMicros}::bigint`,
          committedMicros: sql`${jobs.committedMicros} + ${delta.committedMicros}::bigint`,
        })
        .where(eq(jobs.id, authorization.jobId));
    }
    return toAuthorizationView(authorization);
  });
}

export function settle(db: Db, authorizationId: string, input: SettleInput) {
  return applyTransition(db, authorizationId, authorizationTransitions.settle, {
    ...input,
    reason: null,
  });
}

export function release(db: Db, authorizationId: string, input: ReasonInput) {
  return applyTransition(db, authorizationId, authorizationTransitions.release, {
    txHash: null,
    network: null,
    deliverable: null,
    reason: input.reason,
  });
}

export function markUnresolved(db: Db, authorizationId: string, input: ReasonInput) {
  return applyTransition(db, authorizationId, authorizationTransitions.markUnresolved, {
    txHash: null,
    network: null,
    deliverable: null,
    reason: input.reason,
  });
}

export function reconcile(
  db: Db,
  authorizationId: string,
  input: ReconcileInput,
  reason: string | null = null,
) {
  const transition =
    input.outcome === "SETTLED"
      ? authorizationTransitions.reconcileSettled
      : authorizationTransitions.reconcileReleased;
  return applyTransition(db, authorizationId, transition, {
    txHash: input.txHash,
    network: input.network,
    deliverable: null,
    reason,
  });
}
