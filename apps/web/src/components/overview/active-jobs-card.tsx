import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { JobView } from "@reins/core";
import { Link } from "react-router";
import { BudgetMeter } from "@/components/budget/budget-meter";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { DemoDataChip } from "@/components/status/chips";
import { formatShortTime } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import { appRoutes, jobHref } from "@/lib/routes";
import type { Resource } from "@/lib/use-resource";
import { Panel } from "./panel";

const shownJobs = 8;
const columns = "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_110px_120px_20px]";

function JobRow({ job }: { job: JobView }) {
  return (
    <li>
      <Link
        to={jobHref(job.id)}
        className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-[14px] px-3 py-3 transition-colors hover:bg-white/70 ${columns}`}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-[15px] font-medium">
            <span className="truncate">{job.title}</span>
            {job.isDemoData && (
              <span className="hidden sm:inline-flex">
                <DemoDataChip />
              </span>
            )}
          </p>
          <p className="truncate text-xs text-caption">{job.customer}</p>
        </div>
        <div className="col-span-2 row-start-2 flex flex-col gap-1.5 md:col-span-1 md:row-start-auto">
          <BudgetMeter budget={job.budget} size="sm" />
          <p className="font-mono text-[11px] text-caption tabular-nums">
            of {formatAmount(job.budget.maxBudget)} {job.currency}
          </p>
        </div>
        <p className="text-right font-mono text-[15px] tracking-[-0.03em] tabular-nums md:order-none">
          {formatAmount(job.budget.available)}
          <span className="sr-only"> {job.currency} available</span>
        </p>
        <p className="hidden text-right text-xs text-caption md:block">
          {formatShortTime(job.expiresAt)}
        </p>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          strokeWidth={1.8}
          className="hidden text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none md:block"
          aria-hidden
        />
      </Link>
    </li>
  );
}

export function ActiveJobsCard({ jobs }: { jobs: Resource<readonly JobView[]> }) {
  const active = jobs.data?.filter((job) => job.status === "ACTIVE") ?? null;

  return (
    <Panel
      title="Active jobs"
      description={
        active
          ? `${String(active.length)} ${active.length === 1 ? "job" : "jobs"} can still authorize spending.`
          : "Jobs that can still authorize spending."
      }
      link={{ href: appRoutes.jobs, label: "All jobs" }}
    >
      {jobs.error && (
        <ErrorPanel title="Jobs could not be loaded" error={jobs.error} onRetry={jobs.reload} />
      )}
      {jobs.loading && <p className="text-sm text-muted">Loading jobs…</p>}
      {active?.length === 0 && (
        <p className="rounded-[16px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          No active jobs. Revoked and completed jobs no longer authorize spending.
        </p>
      )}
      {active && active.length > 0 && (
        <>
          <div
            className={`hidden gap-x-4 border-b border-line/70 px-3 pb-2 text-[11px] font-semibold tracking-[0.12em] text-caption uppercase md:grid ${columns}`}
            aria-hidden
          >
            <span>Job</span>
            <span>Budget use</span>
            <span className="text-right">Available</span>
            <span className="text-right">Expires</span>
            <span />
          </div>
          <ul className="mt-1 flex flex-col" aria-label="Active jobs">
            {active.slice(0, shownJobs).map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
          {active.length > shownJobs && (
            <p className="mt-3 px-3 text-sm text-caption">
              Showing {shownJobs} of {active.length}.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
