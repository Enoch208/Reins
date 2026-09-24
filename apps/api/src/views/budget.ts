import { formatMicros, type BudgetView } from "@reins/core";
import type { JobRow } from "../db/client";

export interface OutstandingMicros {
  readonly reservedMicros: number;
  readonly unresolvedMicros: number;
}

export const noOutstanding: OutstandingMicros = { reservedMicros: 0, unresolvedMicros: 0 };

export function availableFromCounters(job: JobRow): number {
  return job.maxBudgetMicros - job.settledMicros - job.committedMicros;
}

export interface BudgetMicros extends OutstandingMicros {
  readonly maxMicros: number;
  readonly settledMicros: number;
}

export function budgetFromMicros(budget: BudgetMicros): BudgetView {
  return {
    maxBudget: formatMicros(budget.maxMicros),
    settled: formatMicros(budget.settledMicros),
    reserved: formatMicros(budget.reservedMicros),
    unresolved: formatMicros(budget.unresolvedMicros),
    available: formatMicros(
      budget.maxMicros - budget.settledMicros - budget.reservedMicros - budget.unresolvedMicros,
    ),
  };
}

export function toBudgetView(job: JobRow, outstanding: OutstandingMicros): BudgetView {
  return budgetFromMicros({
    maxMicros: job.maxBudgetMicros,
    settledMicros: job.settledMicros,
    ...outstanding,
  });
}
