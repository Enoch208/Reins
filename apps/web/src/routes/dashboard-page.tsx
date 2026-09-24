import { Add01Icon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { EmptyState } from "@/components/chrome/empty-state";
import { PageHeading } from "@/components/chrome/page-heading";
import { primaryButton } from "@/components/feedback/button-styles";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { ActiveJobsCard } from "@/components/overview/active-jobs-card";
import { AllocationCard } from "@/components/overview/allocation-card";
import { DashboardSkeleton } from "@/components/overview/dashboard-skeleton";
import { DenialsCard } from "@/components/overview/denials-card";
import { KpiRow } from "@/components/overview/kpi-row";
import { RecentActivityCard } from "@/components/overview/recent-activity-card";
import { SpendByServiceCard } from "@/components/overview/spend-by-service-card";
import { WalletCard } from "@/components/wallet/wallet-card";
import { getOverview, listJobs } from "@/lib/api-client";
import { appRoutes } from "@/lib/routes";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useResource } from "@/lib/use-resource";

const pollMs = 3000;

export function DashboardPage() {
  useDocumentTitle("Overview");
  const overview = useResource("overview", getOverview, pollMs);
  const jobs = useResource("jobs", listJobs, pollMs);
  const data = overview.data;

  return (
    <>
      <PageHeading
        title="Every agent's spend,"
        accent="in one view"
        description="Live across all jobs: what is approved, what is committed to payments in flight, what has settled, and what policy refused."
      />
      {overview.error && (
        <div className="mb-6">
          <ErrorPanel
            title={data ? "Live updates paused" : "The overview could not be loaded"}
            error={overview.error}
            onRetry={overview.reload}
          />
        </div>
      )}
      {overview.loading && <DashboardSkeleton />}
      {data?.jobs.total === 0 && (
        <EmptyState
          icon={DashboardSquare01Icon}
          title="No jobs yet"
          description="Open a job to give an agent team a budget. Its spending, decisions and denials show up here as they happen."
          action={
            <Link to={appRoutes.newJob} className={`${primaryButton} mt-8`}>
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden />
              Create the first job
            </Link>
          }
        />
      )}
      {data && data.jobs.total > 0 && (
        <div className="flex flex-col gap-6">
          <KpiRow overview={data} />
          <AllocationCard overview={data} />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <RecentActivityCard entries={data.recent} />
            <div className="flex flex-col gap-6">
              <DenialsCard denials={data.denialsByReason} />
              <SpendByServiceCard services={data.spendByService} />
              <WalletCard />
            </div>
          </div>
          <ActiveJobsCard jobs={jobs} />
        </div>
      )}
    </>
  );
}
