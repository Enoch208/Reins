import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="glass flex items-center justify-center gap-3 rounded-[26px] px-8 py-16 text-muted"
    >
      <HugeiconsIcon
        icon={Loading03Icon}
        size={20}
        strokeWidth={1.8}
        className="animate-spin motion-reduce:animate-none"
        aria-hidden
      />
      <span className="text-[15px]">{label}</span>
    </div>
  );
}
