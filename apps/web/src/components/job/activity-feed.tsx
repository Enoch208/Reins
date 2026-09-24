import type { LedgerEntryView } from "@reins/core";
import { ErrorPanel } from "@/components/feedback/error-panel";
import type { Resource } from "@/lib/use-resource";
import { ActivityRow } from "./activity-row";

export function ActivityFeed({
  ledger,
  currency,
}: {
  ledger: Resource<readonly LedgerEntryView[]>;
  currency: string;
}) {
  const entries = ledger.data
    ? [...ledger.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : null;
  const denials = entries?.filter((entry) => entry.decision === "DENIED").length ?? 0;

  return (
    <section aria-labelledby="activity-heading" className="glass rounded-[26px] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="activity-heading" className="text-lg font-medium">
          Activity
        </h2>
        {entries && (
          <p className="text-sm text-caption">
            {entries.length} requests
            {denials > 0 && (
              <span className="font-semibold text-denied-ink"> · {denials} denied</span>
            )}
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        Every spend request, newest first. Open one for its evidence.
      </p>
      {ledger.error && (
        <div className="mt-5">
          <ErrorPanel
            title="Activity could not be loaded"
            error={ledger.error}
            onRetry={ledger.reload}
          />
        </div>
      )}
      <div aria-live="polite" aria-busy={ledger.loading} className="mt-5">
        {ledger.loading && <p className="text-sm text-muted">Loading activity…</p>}
        {entries?.length === 0 && (
          <p className="rounded-[16px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            No spend requests yet. They appear here as agents ask to pay for services.
          </p>
        )}
        {entries && entries.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="Spend requests">
            {entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} currency={currency} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
