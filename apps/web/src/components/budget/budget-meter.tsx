import type { BudgetView } from "@reins/core";
import { cx } from "@/lib/cx";
import { formatAmount, shareOf } from "@/lib/money";
import { budgetSegments } from "./segments";

export function BudgetMeter({ budget, size = "lg" }: { budget: BudgetView; size?: "sm" | "lg" }) {
  const segments = budgetSegments(budget);
  const summary = segments
    .map((segment) => `${segment.label} ${formatAmount(segment.amount)}`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Budget ${formatAmount(budget.maxBudget)} USDT: ${summary}`}
      className={cx(
        "flex w-full overflow-hidden rounded-full border border-line bg-white/60",
        size === "lg" ? "h-4 gap-[2px] p-[2px]" : "h-2 gap-px",
      )}
    >
      {segments.map((segment) => {
        const width = shareOf(segment.amount, budget.maxBudget);
        if (width <= 0) return null;
        return (
          <span
            key={segment.key}
            className={cx("h-full rounded-full", segment.fill)}
            style={{ width: `${String(width)}%` }}
          />
        );
      })}
    </div>
  );
}
