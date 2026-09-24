import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@/lib/cx";

export type Tone =
  | "approved"
  | "reserved"
  | "unresolved"
  | "settled"
  | "released"
  | "denied"
  | "revoked"
  | "neutral";

const toneClasses: Record<Tone, string> = {
  approved: "bg-approved-tint text-approved-ink border-approved/40",
  reserved: "bg-reserved-tint text-reserved-ink border-reserved/40",
  unresolved: "bg-unresolved-tint text-unresolved-ink border-unresolved/40",
  settled: "bg-settled-tint text-settled-ink border-settled/40",
  released: "bg-released-tint text-released-ink border-released/40",
  denied: "bg-denied text-white border-denied font-semibold",
  revoked: "bg-revoked text-white border-revoked",
  neutral: "bg-white/70 text-ink-soft border-line",
};

export function StatusChip({
  tone,
  icon,
  label,
  size = "md",
}: {
  tone: Tone;
  icon: IconSvgElement;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium tracking-[0.04em] whitespace-nowrap uppercase",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
      )}
    >
      <HugeiconsIcon icon={icon} size={size === "sm" ? 12 : 14} strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}
