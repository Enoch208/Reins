import { CancelCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { LedgerEntryView } from "@reins/core";
import { denialExplanations } from "@/lib/labels";
import { formatAmount } from "@/lib/money";

export function DenialBanner({ entry, currency }: { entry: LedgerEntryView; currency: string }) {
  return (
    <section
      aria-labelledby="denial-heading"
      className="rounded-[22px] border border-denied bg-denied-tint p-5 shadow-[inset_4px_0_0_var(--color-denied)] sm:p-7"
    >
      <p
        id="denial-heading"
        className="inline-flex items-center gap-2 rounded-full bg-denied px-3.5 py-1.5 text-sm font-semibold tracking-[0.08em] text-white uppercase"
      >
        <HugeiconsIcon icon={CancelCircleIcon} size={16} strokeWidth={2.2} aria-hidden />
        Denied
      </p>
      <p className="mt-4 text-xl font-medium text-denied-ink sm:text-2xl">
        {entry.denialReason ? denialExplanations[entry.denialReason] : "The request was denied."}
      </p>
      <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="text-sm text-denied-ink/80">Requested</dt>
          <dd className="font-mono text-xl tracking-[-0.04em] text-denied-ink tabular-nums">
            {formatAmount(entry.amount)} <span className="font-sans text-sm">{currency}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-denied-ink/80">Available at decision</dt>
          <dd className="font-mono text-xl tracking-[-0.04em] text-denied-ink tabular-nums">
            {formatAmount(entry.availableAtDecision)}{" "}
            <span className="font-sans text-sm">{currency}</span>
          </dd>
        </div>
      </dl>
      <p className="mt-5 border-t border-denied/30 pt-4 font-semibold text-denied-ink">
        No transaction was authorized.
      </p>
    </section>
  );
}
