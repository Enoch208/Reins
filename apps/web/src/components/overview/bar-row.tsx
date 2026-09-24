import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface BarPart {
  readonly key: string;
  readonly percent: number;
  readonly fill: string;
}

export function BarRow({
  label,
  value,
  parts,
  emphasis = false,
}: {
  label: ReactNode;
  value: ReactNode;
  parts: readonly BarPart[];
  emphasis?: boolean;
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={cx("min-w-0 truncate", emphasis ? "text-ink" : "text-ink-soft")}>
          {label}
        </span>
        <span className="shrink-0 font-mono text-[13px] text-ink tabular-nums">{value}</span>
      </div>
      <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-white/70" aria-hidden>
        {parts.map((part) =>
          part.percent > 0 ? (
            <span
              key={part.key}
              className={cx("h-full rounded-full", part.fill)}
              style={{ width: `${String(part.percent)}%` }}
            />
          ) : null,
        )}
      </div>
    </li>
  );
}
