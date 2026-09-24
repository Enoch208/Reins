import { cx } from "@/lib/cx";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  unit,
  note,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={cx(
        "glass flex flex-col justify-between gap-4 rounded-[22px] px-4 py-4 sm:px-5 sm:py-5",
        wide && "col-span-2 lg:col-span-1",
      )}
    >
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-caption uppercase">
        {label}
      </dt>
      <dd className="flex flex-col gap-2">
        <span className="text-[clamp(24px,2.4vw,36px)] leading-none font-medium tracking-[-0.02em] tabular-nums">
          {value}
          {unit && (
            <span className="ml-1.5 text-[13px] font-normal tracking-normal text-muted">
              {unit}
            </span>
          )}
        </span>
        <span className="text-[13px] text-muted">{note}</span>
      </dd>
    </div>
  );
}
