import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { middleTruncate } from "@/lib/labels";

export function HashValue({
  value,
  label,
  full = false,
}: {
  value: string;
  label: string;
  full?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copy = () => {
    void navigator.clipboard.writeText(value).then(
      () => {
        setStatus("copied");
      },
      () => {
        setStatus("failed");
      },
    );
  };

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span
        title={value}
        className={cx("font-mono text-[14px] tabular-nums", full ? "break-all" : "truncate")}
      >
        {full ? value : middleTruncate(value, 10)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-line bg-white/70 px-2 py-1 text-xs text-muted transition-colors hover:text-ink"
      >
        <HugeiconsIcon
          icon={status === "copied" ? Tick02Icon : Copy01Icon}
          size={13}
          strokeWidth={1.9}
          aria-hidden
        />
        <span aria-live="polite">
          {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy"}
        </span>
      </button>
    </span>
  );
}
