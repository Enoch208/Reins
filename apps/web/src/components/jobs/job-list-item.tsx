import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { JobView } from "@reins/core";
import { Link } from "react-router";
import { BudgetMeter } from "@/components/budget/budget-meter";
import { DemoDataChip, JobStatusChip } from "@/components/status/chips";
import { formatAmount } from "@/lib/money";
import { jobHref } from "@/lib/routes";

export function JobListItem({ job }: { job: JobView }) {
  return (
    <li>
      <Link
        to={jobHref(job.id)}
        className="glass group grid gap-5 rounded-[22px] px-6 py-5 transition-shadow hover:shadow-[0_0_0_1px_var(--color-line)] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusChip status={job.status} size="sm" />
            {job.isDemoData && <DemoDataChip />}
          </div>
          <p className="mt-2.5 truncate text-lg font-medium tracking-[-0.01em]">{job.title}</p>
          <p className="mt-0.5 truncate text-sm text-muted">{job.customer}</p>
        </div>

        <div className="flex flex-col gap-2">
          <BudgetMeter budget={job.budget} size="sm" />
          <p className="text-xs text-caption">
            Budget{" "}
            <span className="font-mono tabular-nums">{formatAmount(job.budget.maxBudget)}</span>{" "}
            {job.currency}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="md:text-right">
            <p className="text-xs text-caption">Available</p>
            <p className="font-mono text-lg tracking-[-0.04em] tabular-nums">
              {formatAmount(job.budget.available)}
              <span className="ml-1.5 font-sans text-xs text-muted">{job.currency}</span>
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            strokeWidth={1.8}
            className="text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}
