import type { AuthorizationState } from "./contract";

export interface AuthorizationTransition {
  readonly from: AuthorizationState;
  readonly to: AuthorizationState;
}

export const authorizationTransitions = {
  settle: { from: "RESERVED", to: "SETTLED" },
  release: { from: "RESERVED", to: "RELEASED" },
  markUnresolved: { from: "RESERVED", to: "UNRESOLVED" },
  reconcileSettled: { from: "UNRESOLVED", to: "SETTLED" },
  reconcileReleased: { from: "UNRESOLVED", to: "RELEASED" },
} as const satisfies Record<string, AuthorizationTransition>;

export type AuthorizationTransitionName = keyof typeof authorizationTransitions;

export interface CounterDelta {
  readonly settledMicros: number;
  readonly committedMicros: number;
}

export function isLegalTransition(from: AuthorizationState, to: AuthorizationState): boolean {
  return Object.values(authorizationTransitions).some(
    (transition) => transition.from === from && transition.to === to,
  );
}

export function counterDelta(
  transition: AuthorizationTransition,
  amountMicros: number,
): CounterDelta {
  if (!isLegalTransition(transition.from, transition.to)) {
    throw new RangeError(`Illegal authorization transition ${transition.from} -> ${transition.to}`);
  }
  if (transition.to === "SETTLED") {
    return { settledMicros: amountMicros, committedMicros: -amountMicros };
  }
  if (transition.to === "RELEASED") {
    return { settledMicros: 0, committedMicros: -amountMicros };
  }
  return { settledMicros: 0, committedMicros: 0 };
}
