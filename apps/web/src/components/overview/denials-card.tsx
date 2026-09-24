import type { DenialCount } from "@reins/core";
import { denialLabels } from "@/lib/labels";
import { percentOf } from "@/lib/money";
import { appRoutes } from "@/lib/routes";
import { BarRow } from "./bar-row";
import { Panel } from "./panel";

export function DenialsCard({ denials }: { denials: readonly DenialCount[] }) {
  const sorted = [...denials].sort((a, b) => b.count - a.count);
  const largest = sorted[0]?.count ?? 0;
  const total = sorted.reduce((sum, item) => sum + item.count, 0);

  return (
    <Panel
      title="Denials by reason"
      description={
        total === 0
          ? "Policy has not refused a request yet."
          : `${String(total)} requests refused, by the first policy check they failed.`
      }
      link={{ href: appRoutes.activity, label: "Review" }}
    >
      {sorted.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
          No denials recorded.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5" aria-label="Denials by reason">
          {sorted.map((item) => (
            <BarRow
              key={item.reason}
              label={denialLabels[item.reason]}
              value={
                <span className="font-semibold text-denied-ink">
                  {item.count}
                  <span className="sr-only"> denied</span>
                </span>
              }
              parts={[{ key: "count", percent: percentOf(item.count, largest), fill: "bg-denied" }]}
              emphasis
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}
