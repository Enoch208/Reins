import { useCallback } from "react";
import { useParams } from "react-router";
import { BudgetCard } from "@/components/budget/budget-card";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { ActivityFeed } from "@/components/job/activity-feed";
import { AgentsPanel } from "@/components/job/agents-panel";
import { JobHeader } from "@/components/job/job-header";
import { getJob, getLedger, revoke } from "@/lib/api-client";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useResource } from "@/lib/use-resource";

const pollMs = 2000;

export function JobPage() {
  const { jobId = "" } = useParams();
  const detail = useResource(`job:${jobId}`, (signal) => getJob(jobId, signal), pollMs);
  const ledger = useResource(`ledger:${jobId}`, (signal) => getLedger(jobId, signal), pollMs);
  useDocumentTitle(detail.data?.job.title ?? "Job");

  const { reload: reloadDetail } = detail;
  const { reload: reloadLedger } = ledger;
  const revokeWith = useCallback(
    async (agentId: string | null) => {
      await revoke(jobId, { agentId });
      reloadDetail();
      reloadLedger();
    },
    [jobId, reloadDetail, reloadLedger],
  );

  if (detail.data === null) {
    return detail.error ? (
      <ErrorPanel
        title="This job could not be loaded"
        error={detail.error}
        onRetry={detail.reload}
      />
    ) : (
      <LoadingPanel label="Loading job" />
    );
  }

  const { job, agents } = detail.data;

  return (
    <>
      <JobHeader job={job} onRevoke={() => revokeWith(null)} />
      {detail.error && (
        <div className="mb-6">
          <ErrorPanel title="Live updates paused" error={detail.error} onRetry={detail.reload} />
        </div>
      )}
      <div className="flex flex-col gap-6">
        <BudgetCard job={job} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <AgentsPanel agents={agents} canRevoke={job.status === "ACTIVE"} onRevoke={revokeWith} />
          <ActivityFeed ledger={ledger} currency={job.currency} />
        </div>
      </div>
    </>
  );
}
