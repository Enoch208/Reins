import { ArrowLeft01Icon, FileValidationIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/chrome/empty-state";
import { PageHeading } from "@/components/chrome/page-heading";
import { EvidenceDetail } from "@/components/evidence/evidence-detail";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { getEvidence } from "@/lib/api-client";
import { jobHref } from "@/lib/routes";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useResource } from "@/lib/use-resource";

export function EvidencePage() {
  const { jobId = "", entryId = "" } = useParams();
  const evidence = useResource(`evidence:${jobId}`, (signal) => getEvidence(jobId, signal), 5000);
  const entry = evidence.data?.entries.find((item) => item.id === entryId) ?? null;
  useDocumentTitle(entry ? `Evidence · ${entry.service}` : "Evidence");

  const back = (
    <Link
      to={jobHref(jobId)}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} aria-hidden />
      {evidence.data ? evidence.data.job.title : "Back to job"}
    </Link>
  );

  if (evidence.data === null) {
    return (
      <>
        {back}
        {evidence.error ? (
          <ErrorPanel
            title="Evidence could not be loaded"
            error={evidence.error}
            onRetry={evidence.reload}
          />
        ) : (
          <LoadingPanel label="Loading evidence" />
        )}
      </>
    );
  }

  if (entry === null) {
    return (
      <>
        {back}
        <EmptyState
          icon={FileValidationIcon}
          headingLevel="h1"
          title="No such spend request"
          description="This job has no ledger entry with that id."
        />
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeading
        title={entry.decision === "DENIED" ? "Why it was" : "Why this was"}
        accent={entry.decision === "DENIED" ? "refused" : "approved"}
        description="The chain from the customer job to the agent, the policy decision, the reservation and the payment, as the ledger recorded it."
      />
      {evidence.error && (
        <div className="mb-6">
          <ErrorPanel
            title="Live updates paused"
            error={evidence.error}
            onRetry={evidence.reload}
          />
        </div>
      )}
      <EvidenceDetail evidence={evidence.data} entry={entry} />
    </>
  );
}
