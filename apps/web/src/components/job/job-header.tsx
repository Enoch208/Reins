import { ArrowLeft01Icon, StopCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { JobView } from "@reins/core";
import { Link } from "react-router";
import { DemoDataChip, JobStatusChip } from "@/components/status/chips";
import { formatTime } from "@/lib/labels";
import { appRoutes } from "@/lib/routes";
import { ConfirmAction } from "./confirm-action";

export function JobHeader({ job, onRevoke }: { job: JobView; onRevoke: () => Promise<void> }) {
  return (
    <header className="mb-8">
      <Link
        to={appRoutes.jobs}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} aria-hidden />
        All jobs
      </Link>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusChip status={job.status} />
            {job.isDemoData && <DemoDataChip />}
          </div>
          <h1 className="mt-4 text-[clamp(32px,3.4vw,48px)] leading-[1.1] font-normal tracking-[-0.015em] [font-stretch:90%]">
            {job.title}
          </h1>
          <p className="mt-2 text-base text-muted">
            For <span className="text-ink">{job.customer}</span>
            <span aria-hidden> · </span>
            <span className="block sm:inline">
              {job.status === "REVOKED" && job.revokedAt
                ? `Revoked ${formatTime(job.revokedAt)}`
                : `Expires ${formatTime(job.expiresAt)}`}
            </span>
          </p>
        </div>
        {job.status === "ACTIVE" && (
          <ConfirmAction
            icon={StopCircleIcon}
            label="Revoke job"
            question="Stop every agent on this job from receiving new authorizations? Existing reservations stay tracked."
            confirmLabel="Revoke job"
            onConfirm={onRevoke}
          />
        )}
      </div>
    </header>
  );
}
