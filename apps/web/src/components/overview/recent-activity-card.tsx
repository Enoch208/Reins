import type { ActivityEntryView } from "@reins/core";
import { ActivityRow } from "@/components/job/activity-row";
import { appRoutes } from "@/lib/routes";
import { Panel } from "./panel";

export function RecentActivityCard({ entries }: { entries: readonly ActivityEntryView[] }) {
  return (
    <Panel
      title="Recent activity"
      description="The latest spend requests across every job. Open one for its evidence."
      link={{ href: appRoutes.activity, label: "View all" }}
    >
      <div aria-live="polite">
        {entries.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            No spend requests yet. They appear here as agents ask to pay for services.
          </p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Recent spend requests">
            {entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} currency="USDT" jobTitle={entry.jobTitle} />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
