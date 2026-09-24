import { AlertCircleIcon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ErrorPanel({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="glass flex flex-col gap-4 rounded-[22px] border border-denied/40 px-6 py-5 sm:flex-row sm:items-center"
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        size={22}
        strokeWidth={1.8}
        className="shrink-0 text-denied"
        aria-hidden
      />
      <div className="flex-1">
        <p className="font-medium text-denied-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{error.message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 self-start rounded-[11px] border border-line bg-white/70 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-white sm:self-auto"
        >
          <HugeiconsIcon icon={Refresh01Icon} size={16} strokeWidth={1.8} aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
