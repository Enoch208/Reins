import type { BudgetView, DecimalAmount } from "@reins/core";

export interface BudgetSegment {
  readonly key: "settled" | "reserved" | "unresolved" | "available";
  readonly label: string;
  readonly amount: DecimalAmount;
  readonly fill: string;
  readonly swatch: string;
}

export function budgetSegments(budget: BudgetView): readonly BudgetSegment[] {
  return [
    {
      key: "settled",
      label: "Settled",
      amount: budget.settled,
      fill: "bg-settled",
      swatch: "bg-settled",
    },
    {
      key: "reserved",
      label: "Reserved",
      amount: budget.reserved,
      fill: "bg-reserved",
      swatch: "bg-reserved",
    },
    {
      key: "unresolved",
      label: "Unresolved",
      amount: budget.unresolved,
      fill: "bg-unresolved",
      swatch: "bg-unresolved",
    },
    {
      key: "available",
      label: "Available",
      amount: budget.available,
      fill: "bg-white/85",
      swatch: "bg-white border border-line",
    },
  ];
}
