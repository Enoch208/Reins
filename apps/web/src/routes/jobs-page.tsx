import { Add01Icon, Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { EmptyState } from "@/components/chrome/empty-state";
import { PageHeading } from "@/components/chrome/page-heading";
import { primaryButton } from "@/components/feedback/button-styles";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { JobListItem } from "@/components/jobs/job-list-item";
import { listJobs } from "@/lib/api-client";
import { appRoutes } from "@/lib/routes";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useResource } from "@/lib/use-resource";

function NewJobLink() {
  return (
    <Link to={appRoutes.newJob} className={primaryButton}>
      <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden />
      New job
    </Link>
  );
}

export function JobsPage() {
  useDocumentTitle("Jobs");
  const jobs = useResource("jobs", listJobs, 5000);

  return (
    <>
      <PageHeading
        title="Every job you"
        accent="fund"
        description="Each job carries one budget that every agent working on it shares, including delegated and replacement agents."
        aside={<NewJobLink />}
      />
      {jobs.error && (
        <div className="mb-6">
          <ErrorPanel title="Jobs could not be loaded" error={jobs.error} onRetry={jobs.reload} />
        </div>
      )}
      {jobs.loading && <LoadingPanel label="Loading jobs" />}
      {jobs.data?.length === 0 && (
        <EmptyState
          icon={Briefcase01Icon}
          title="No jobs yet"
          description="A job sets the budget, the per-purchase limit, the allowed services and the expiry that every agent on it draws from."
          action={
            <div className="mt-8">
              <NewJobLink />
            </div>
          }
        />
      )}
      {jobs.data && jobs.data.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Jobs">
          {jobs.data.map((job) => (
            <JobListItem key={job.id} job={job} />
          ))}
        </ul>
      )}
    </>
  );
}
