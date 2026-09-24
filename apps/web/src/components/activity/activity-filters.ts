import type { ActivityEntryView } from "@reins/core";

export type ActivityFilter = "ALL" | "APPROVED" | "DENIED" | "UNRESOLVED";

export const activityFilters: readonly {
  readonly key: ActivityFilter;
  readonly label: string;
  readonly matches: (entry: ActivityEntryView) => boolean;
}[] = [
  { key: "ALL", label: "All", matches: () => true },
  { key: "APPROVED", label: "Approved", matches: (entry) => entry.decision === "APPROVED" },
  { key: "DENIED", label: "Denied", matches: (entry) => entry.decision === "DENIED" },
  {
    key: "UNRESOLVED",
    label: "Unresolved",
    matches: (entry) => entry.authorization?.state === "UNRESOLVED",
  },
];
