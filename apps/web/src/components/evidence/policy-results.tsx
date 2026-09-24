import { CancelCircleIcon, MinusSignCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { policyChecks, type LedgerEntryView } from "@reins/core";
import { cx } from "@/lib/cx";
import { denialExplanations } from "@/lib/labels";

type Outcome = "pass" | "fail" | "skipped";

function outcomes(entry: LedgerEntryView): readonly Outcome[] {
  const failedAt = policyChecks.findIndex((check) => check.reason === entry.denialReason);
  if (entry.decision === "APPROVED" || failedAt < 0) return policyChecks.map(() => "pass");
  return policyChecks.map((_, index) =>
    index < failedAt ? "pass" : index === failedAt ? "fail" : "skipped",
  );
}

const outcomeIcon = {
  pass: Tick02Icon,
  fail: CancelCircleIcon,
  skipped: MinusSignCircleIcon,
} as const;
const outcomeWord = { pass: "Passed", fail: "Failed", skipped: "Not evaluated" } as const;

export function PolicyResults({ entry }: { entry: LedgerEntryView }) {
  const results = outcomes(entry);

  return (
    <ol className="flex flex-col gap-1.5" aria-label="Policy checks in evaluation order">
      {policyChecks.map((check, index) => {
        const outcome = results[index] ?? "skipped";
        return (
          <li
            key={check.reason}
            className={cx(
              "flex flex-col gap-1 rounded-[12px] border px-3.5 py-2.5",
              outcome === "fail" &&
                "border-denied bg-denied-tint shadow-[inset_3px_0_0_var(--color-denied)]",
              outcome === "pass" && "border-line/70 bg-white/55",
              outcome === "skipped" && "border-dashed border-line bg-transparent",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon
                  icon={outcomeIcon[outcome]}
                  size={18}
                  strokeWidth={2}
                  className={cx(
                    "shrink-0",
                    outcome === "pass" && "text-approved",
                    outcome === "fail" && "text-denied",
                    outcome === "skipped" && "text-faint",
                  )}
                  aria-hidden
                />
                <span
                  className={cx(
                    "text-[15px]",
                    outcome === "fail" && "font-semibold text-denied-ink",
                    outcome === "skipped" && "text-muted",
                  )}
                >
                  {check.label}
                </span>
              </div>
              <span
                className={cx(
                  "shrink-0 text-xs font-medium tracking-[0.04em] uppercase",
                  outcome === "pass" && "text-approved-ink",
                  outcome === "fail" && "text-denied-ink",
                  outcome === "skipped" && "text-caption",
                )}
              >
                {outcomeWord[outcome]}
              </span>
            </div>
            {outcome === "fail" && (
              <p className="pl-7 text-sm text-denied-ink">{denialExplanations[check.reason]}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
