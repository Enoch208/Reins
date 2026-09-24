import { describe, expect, it } from "vitest";
import { authorizationStates } from "../src/contract";
import { authorizationTransitions, counterDelta, isLegalTransition } from "../src/transitions";

describe("authorization transitions", () => {
  it("permits exactly the documented state machine", () => {
    const legal = authorizationStates.flatMap((from) =>
      authorizationStates.filter((to) => isLegalTransition(from, to)).map((to) => `${from}->${to}`),
    );
    expect(legal.sort()).toEqual(
      [
        "RESERVED->SETTLED",
        "RESERVED->RELEASED",
        "RESERVED->UNRESOLVED",
        "UNRESOLVED->SETTLED",
        "UNRESOLVED->RELEASED",
      ].sort(),
    );
  });

  it("moves committed into settled on settlement", () => {
    expect(counterDelta(authorizationTransitions.settle, 400_000)).toEqual({
      settledMicros: 400_000,
      committedMicros: -400_000,
    });
    expect(counterDelta(authorizationTransitions.reconcileSettled, 400_000)).toEqual({
      settledMicros: 400_000,
      committedMicros: -400_000,
    });
  });

  it("returns committed capacity on release", () => {
    expect(counterDelta(authorizationTransitions.release, 400_000)).toEqual({
      settledMicros: 0,
      committedMicros: -400_000,
    });
    expect(counterDelta(authorizationTransitions.reconcileReleased, 400_000)).toEqual({
      settledMicros: 0,
      committedMicros: -400_000,
    });
  });

  it("keeps an unresolved amount counted against the budget", () => {
    expect(counterDelta(authorizationTransitions.markUnresolved, 400_000)).toEqual({
      settledMicros: 0,
      committedMicros: 0,
    });
  });

  it("refuses illegal transitions", () => {
    expect(() => counterDelta({ from: "SETTLED", to: "RELEASED" }, 1)).toThrow(RangeError);
    expect(() => counterDelta({ from: "RELEASED", to: "RESERVED" }, 1)).toThrow(RangeError);
  });
});
