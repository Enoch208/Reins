import { useState } from "react";
import { PageHeading } from "@/components/chrome/page-heading";
import { activityFilters, type ActivityFilter } from "@/components/activity/activity-filters";
import { FilterTabs } from "@/components/activity/filter-tabs";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { ActivityRow } from "@/components/job/activity-row";
import { listActivity } from "@/lib/api-client";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useResource } from "@/lib/use-resource";

const emptyMessages: Record<ActivityFilter, string> = {
  ALL: "No spend requests yet. They appear here as agents ask to pay for services.",
  APPROVED: "No approved requests in the latest activity.",
  DENIED: "No denied requests in the latest activity.",
  UNRESOLVED: "No unresolved payments in the latest activity.",
};

export function ActivityPage() {
  useDocumentTitle("Activity");
  const activity = useResource("activity", listActivity, 3000);
  const [filter, setFilter] = useState<ActivityFilter>("ALL");
  const matches = activityFilters.find((item) => item.key === filter)?.matches ?? (() => true);
  const shown = activity.data?.filter(matches) ?? null;

  return (
    <>
      <PageHeading
        title="Every request,"
        accent="every job"
        description="The latest 100 spend requests across all jobs, newest first. Open any row for its evidence."
      />
      <div className="mb-5">
        <FilterTabs entries={activity.data} value={filter} onChange={setFilter} />
      </div>
      {activity.error && (
        <div className="mb-6">
          <ErrorPanel
            title={activity.data ? "Live updates paused" : "Activity could not be loaded"}
            error={activity.error}
            onRetry={activity.reload}
          />
        </div>
      )}
      {activity.loading && <LoadingPanel label="Loading activity" />}
      <div aria-live="polite">
        {shown?.length === 0 && (
          <p className="glass rounded-[22px] px-6 py-10 text-center text-sm text-muted">
            {emptyMessages[filter]}
          </p>
        )}
        {shown && shown.length > 0 && (
          <ul
            className="glass flex flex-col gap-2 rounded-[24px] p-3 sm:p-4"
            aria-label="Spend requests"
          >
            {shown.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} currency="USDT" jobTitle={entry.jobTitle} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
