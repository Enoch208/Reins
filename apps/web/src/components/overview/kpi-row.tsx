import { CancelCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { OverviewView } from "@reins/core";
import { formatAmount, microsOf, shareOf } from "@/lib/money";
import { KpiCard } from "./kpi-card";

const currency = "USDT";

function Decisions({ approved, denied }: { approved: number; denied: number }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <span className="inline-flex items-baseline gap-1.5 text-ink">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={18}
          strokeWidth={2}
          className="self-center text-approved"
          aria-hidden
        />
        {approved}
        <span className="text-[13px] font-normal tracking-normal text-muted">approved</span>
      </span>
      <span className="inline-flex items-baseline gap-1.5 font-semibold text-denied-ink">
        <HugeiconsIcon
          icon={CancelCircleIcon}
          size={18}
          strokeWidth={2}
          className="self-center text-denied"
          aria-hidden
        />
        {denied}
        <span className="text-[13px] font-semibold tracking-normal text-denied">denied</span>
      </span>
    </span>
  );
}

export function KpiRow({ overview }: { overview: OverviewView }) {
  const { activeBudget, jobs, decisions } = overview;
  const hasRevenue = microsOf(overview.revenue) > 0;
  const totalDecisions = decisions.approved + decisions.denied;

  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)]">
      <KpiCard
        label="Active budget"
        value={formatAmount(activeBudget.maxBudget)}
        unit={currency}
        note={`Approved across ${String(jobs.active)} active ${jobs.active === 1 ? "job" : "jobs"}`}
      />
      <KpiCard
        label="Available now"
        value={formatAmount(activeBudget.available)}
        unit={currency}
        note={`${String(Math.round(shareOf(activeBudget.available, activeBudget.maxBudget)))}% of the active budget is uncommitted`}
      />
      <KpiCard
        label="Settled all-time"
        value={formatAmount(overview.settledAllTime)}
        unit={currency}
        note="Payments settled with a recorded transaction"
      />
      <KpiCard
        label="Revenue"
        value={hasRevenue ? formatAmount(overview.revenue) : "None"}
        {...(hasRevenue ? { unit: currency } : {})}
        note={hasRevenue ? "Customer revenue recorded on jobs" : "No job has recorded revenue"}
      />
      <KpiCard
        label="Decisions"
        wide
        value={<Decisions approved={decisions.approved} denied={decisions.denied} />}
        note={
          totalDecisions === 0
            ? "No spend requests yet"
            : `${String(Math.round((decisions.denied * 100) / totalDecisions))}% of ${String(totalDecisions)} requests refused by policy`
        }
      />
    </dl>
  );
}
