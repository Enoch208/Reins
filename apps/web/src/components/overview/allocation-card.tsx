import type { OverviewView } from "@reins/core";
import { BudgetLegend } from "@/components/budget/budget-legend";
import { BudgetMeter } from "@/components/budget/budget-meter";
import { appRoutes } from "@/lib/routes";
import { Panel } from "./panel";

function Count({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {label}
      <span className="font-mono text-[15px] text-ink tabular-nums">{value}</span>
    </div>
  );
}

export function AllocationCard({ overview }: { overview: OverviewView }) {
  const { jobs } = overview;

  return (
    <Panel
      title="Budget allocation"
      description="Every active job's budget, split by what is settled, held for payments in flight, and still free."
      link={{ href: appRoutes.jobs, label: "All jobs" }}
    >
      <BudgetMeter budget={overview.activeBudget} />
      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex-1">
          <BudgetLegend budget={overview.activeBudget} />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line/70 pt-4 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
          <Count label="Active jobs" value={jobs.active} dot="bg-approved" />
          <Count label="Revoked" value={jobs.revoked} dot="bg-revoked" />
          {jobs.completed > 0 && (
            <Count label="Completed" value={jobs.completed} dot="bg-settled" />
          )}
        </div>
      </div>
    </Panel>
  );
}
