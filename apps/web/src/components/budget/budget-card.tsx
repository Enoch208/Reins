import type { JobView } from "@reins/core";
import { formatAmount } from "@/lib/money";
import { BudgetLegend } from "./budget-legend";
import { BudgetMeter } from "./budget-meter";

function Figure({ label, amount, currency }: { label: string; amount: string; currency: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-caption uppercase">{label}</p>
      <p className="mt-1.5 text-[clamp(32px,3.2vw,44px)] leading-none font-medium tracking-[-0.02em] tabular-nums">
        {formatAmount(amount)}
        <span className="ml-2 text-sm font-normal tracking-normal text-muted">{currency}</span>
      </p>
    </div>
  );
}

export function BudgetCard({ job }: { job: JobView }) {
  const { budget, currency } = job;

  return (
    <section aria-labelledby="budget-heading" className="glass rounded-[26px] p-6 sm:p-8">
      <h2 id="budget-heading" className="sr-only">
        Budget
      </h2>
      <div className="flex flex-wrap gap-x-14 gap-y-6">
        <Figure label="Approved budget" amount={budget.maxBudget} currency={currency} />
        <Figure label="Available" amount={budget.available} currency={currency} />
        {job.revenue !== null && (
          <Figure label="Revenue" amount={job.revenue} currency={currency} />
        )}
      </div>

      <div className="mt-8">
        <BudgetMeter budget={budget} />
      </div>

      <div className="mt-5">
        <BudgetLegend budget={budget} />
      </div>

      <p className="mt-6 border-t border-line/70 pt-4 text-sm text-muted">
        Per-purchase limit{" "}
        <span className="font-mono text-ink tabular-nums">{formatAmount(job.maxPerPurchase)}</span>{" "}
        {currency}. Settled plus reserved plus unresolved never exceeds the approved budget.
      </p>
    </section>
  );
}
