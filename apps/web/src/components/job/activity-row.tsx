import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { LedgerEntryView } from "@reins/core";
import { Link } from "react-router";
import { AuthorizationChip, DecisionChip } from "@/components/status/chips";
import { cx } from "@/lib/cx";
import { denialExplanations, formatTime } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import { evidenceHref } from "@/lib/routes";

export function ActivityRow({
  entry,
  currency,
  jobTitle,
}: {
  entry: LedgerEntryView;
  currency: string;
  jobTitle?: string;
}) {
  const denied = entry.decision === "DENIED";

  return (
    <li>
      <Link
        to={evidenceHref(entry.jobId, entry.id)}
        aria-label={`${entry.service}, ${formatAmount(entry.amount)} ${currency}, ${denied ? "denied" : "approved"}. Open evidence.`}
        className={cx(
          "group grid gap-3 rounded-[16px] border px-4 py-3.5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
          denied
            ? "border-denied/40 bg-denied-tint shadow-[inset_3px_0_0_var(--color-denied)] hover:bg-denied-tint/80"
            : "border-line/80 bg-white/55 hover:bg-white/85",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p
              className={cx(
                "truncate font-mono text-[14px]",
                denied ? "font-semibold text-denied-ink" : "text-ink",
              )}
            >
              {entry.service}
            </p>
            <p className="min-w-0 text-xs text-caption">
              {jobTitle && <span className="font-medium text-ink-soft">{jobTitle} · </span>}
              {entry.agentName ?? "Unknown agent"} · {formatTime(entry.createdAt)}
            </p>
          </div>
          {denied && entry.denialReason && (
            <p className="mt-1.5 text-sm font-medium text-denied-ink">
              {denialExplanations[entry.denialReason]}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span
            className={cx(
              "mr-1 font-mono text-[15px] tabular-nums",
              denied ? "font-semibold text-denied-ink" : "text-ink",
            )}
          >
            {formatAmount(entry.amount)}
          </span>
          <DecisionChip decision={entry.decision} size="sm" />
          {entry.authorization && <AuthorizationChip state={entry.authorization.state} size="sm" />}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            strokeWidth={1.8}
            className="ml-auto shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none sm:ml-0"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}
