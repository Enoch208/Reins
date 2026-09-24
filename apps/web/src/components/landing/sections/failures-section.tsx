import { RepeatIcon, UserMultiple02Icon, UserSwitchIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { revealDelay } from "../reveal-delay";

interface Failure {
  readonly story: string;
  readonly name: string;
  readonly answer: string;
  readonly icon: IconSvgElement;
  readonly tone: "a1" | "a2" | "a3";
  readonly delay: number | null;
}

const failures: readonly Failure[] = [
  {
    story:
      "Three agents each checked the balance, each saw 1.00, and each spent 0.40. Every decision was reasonable. Together they spent 1.20.",
    name: "Concurrent purchases",
    answer: "Answered by atomic reservation",
    icon: UserMultiple02Icon,
    tone: "a1",
    delay: 0.18,
  },
  {
    story:
      "A payment timed out, so the agent tried again. The provider had already been paid the first time.",
    name: "Retries and timeouts",
    answer: "Answered by operation IDs and reconciliation",
    icon: RepeatIcon,
    tone: "a2",
    delay: null,
  },
  {
    story:
      "The research agent crashed halfway through. Its replacement started with a fresh allowance of its own.",
    name: "Worker replacement",
    answer: "Answered by job-level authority",
    icon: UserSwitchIcon,
    tone: "a3",
    delay: 0.36,
  },
];

export function FailuresSection() {
  return (
    <section className="section" id="failures">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          Where shared budgets <span className="serif">break</span>
        </h2>
      </div>
      <div className="quotes">
        {failures.map((failure) => (
          <article
            key={failure.name}
            className="quote"
            data-reveal
            style={revealDelay(failure.delay)}
          >
            <span className="mark" aria-hidden>
              &rdquo;
            </span>
            <p>{failure.story}</p>
            <div className="who">
              <span className={`avatar ${failure.tone}`}>
                <HugeiconsIcon icon={failure.icon} size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <b>{failure.name}</b>
                <small>{failure.answer}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
