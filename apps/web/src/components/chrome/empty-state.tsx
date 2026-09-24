import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = "h2",
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <section className="glass flex flex-col items-center rounded-[26px] px-8 py-20 text-center">
      <div className="glass-tile flex size-[88px] items-center justify-center rounded-[22px] text-ink">
        <HugeiconsIcon icon={icon} size={38} strokeWidth={1.5} aria-hidden />
      </div>
      <Heading className="mt-9 text-2xl font-medium tracking-[-0.01em]">{title}</Heading>
      <p className="mt-3 max-w-md text-base leading-relaxed font-light text-muted">{description}</p>
      {action}
    </section>
  );
}
