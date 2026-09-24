import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageHeading } from "@/components/chrome/page-heading";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { JobForm } from "@/components/job-form/job-form";
import { toCreateJobBody, type JobFormValues } from "@/components/job-form/validate";
import { createJob } from "@/lib/api-client";
import { appRoutes, jobHref } from "@/lib/routes";
import { useDocumentTitle } from "@/lib/use-document-title";

export function NewJobPage() {
  useDocumentTitle("New job");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<Error | null>(null);

  const submit = (values: JobFormValues) => {
    setSubmitting(true);
    setServerError(null);
    void createJob(toCreateJobBody(values, Date.now())).then(
      (job) => {
        void navigate(jobHref(job.id));
      },
      (cause: unknown) => {
        setSubmitting(false);
        setServerError(cause instanceof Error ? cause : new Error(String(cause)));
      },
    );
  };

  return (
    <>
      <Link
        to={appRoutes.jobs}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} aria-hidden />
        All jobs
      </Link>
      <PageHeading
        title="Open a new"
        accent="job"
        description="The budget and limits you set here bind every agent on the job, including agents they delegate to and agents that replace them."
      />
      <section className="glass rounded-[26px] p-6 sm:p-8">
        {serverError && (
          <div className="mb-6">
            <ErrorPanel title="The job was not created" error={serverError} />
          </div>
        )}
        <JobForm submitting={submitting} onSubmit={submit} />
      </section>
    </>
  );
}
