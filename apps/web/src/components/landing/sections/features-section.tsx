import { HierarchyIcon, RepeatIcon, SecurityLockIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { revealDelay } from "../reveal-delay";

interface Feature {
  readonly icon: IconSvgElement;
  readonly title: string;
  readonly lines: readonly [string, string];
  readonly delay: number | null;
}

const features: readonly Feature[] = [
  {
    icon: SecurityLockIcon,
    title: "Atomic reservations",
    lines: ["Capacity is reserved before any payment,", "so parallel agents cannot overspend"],
    delay: 0.22,
  },
  {
    icon: HierarchyIcon,
    title: "Delegation, not new money",
    lines: ["Child and replacement agents draw", "from the same remaining budget"],
    delay: null,
  },
  {
    icon: RepeatIcon,
    title: "Idempotent retries",
    lines: ["A retried operation returns its first", "decision, never a second charge"],
    delay: 0.4,
  },
];

export function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          One <span className="serif">budget</span>
          <br />
          for the whole team
        </h2>
      </div>
      <div className="cards">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="card"
            data-reveal
            style={revealDelay(feature.delay)}
          >
            <div className="icon-tile">
              <HugeiconsIcon icon={feature.icon} size={44} strokeWidth={1.5} aria-hidden />
            </div>
            <h3>{feature.title}</h3>
            <p>
              {feature.lines[0]}
              <br />
              {feature.lines[1]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
