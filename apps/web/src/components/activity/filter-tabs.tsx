import type { ActivityEntryView } from "@reins/core";
import { cx } from "@/lib/cx";
import { activityFilters, type ActivityFilter } from "./activity-filters";

const activeTone: Record<ActivityFilter, string> = {
  ALL: "border-ink bg-ink text-white",
  APPROVED: "border-approved/40 bg-approved-tint text-approved-ink",
  DENIED: "border-denied bg-denied text-white",
  UNRESOLVED: "border-unresolved/40 bg-unresolved-tint text-unresolved-ink",
};

export function FilterTabs({
  entries,
  value,
  onChange,
}: {
  entries: readonly ActivityEntryView[] | null;
  value: ActivityFilter;
  onChange: (next: ActivityFilter) => void;
}) {
  return (
    <div role="group" aria-label="Filter activity" className="flex flex-wrap gap-2">
      {activityFilters.map((filter) => {
        const pressed = filter.key === value;
        const count = entries?.filter(filter.matches).length;
        return (
          <button
            key={filter.key}
            type="button"
            aria-pressed={pressed}
            onClick={() => {
              onChange(filter.key);
            }}
            className={cx(
              "inline-flex items-center gap-2 rounded-[11px] border px-3.5 py-2 text-sm font-medium transition-colors",
              pressed ? activeTone[filter.key] : "border-line bg-white/70 text-ink hover:bg-white",
            )}
          >
            {filter.label}
            {count !== undefined && (
              <span className="font-mono text-xs tabular-nums opacity-80">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
