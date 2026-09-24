import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ExplorerLink({ href, networkName }: { href: string; networkName: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
    >
      View on the {networkName} explorer
      <HugeiconsIcon icon={LinkSquare02Icon} size={15} strokeWidth={1.9} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
