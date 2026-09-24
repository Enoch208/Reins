import type { BudgetView } from "@reins/core";
import { cx } from "@/lib/cx";
import { formatAmount } from "@/lib/money";
import { budgetSegments } from "./segments";

export function BudgetLegend({ budget }: { budget: BudgetView }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {budgetSegments(budget).map((segment) => (
        <div key={segment.key} className="flex flex-col gap-1">
          <dt className="flex items-center gap-2 text-sm text-muted">
            <span className={cx("size-2.5 rounded-full", segment.swatch)} aria-hidden />
            {segment.label}
          </dt>
          <dd className="font-mono text-lg tracking-[-0.04em] text-ink tabular-nums">
            {formatAmount(segment.amount)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
