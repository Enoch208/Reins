import {
  ArrowRight02Icon,
  ArrowTurnBackwardIcon,
  CheckListIcon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  HelpCircleIcon,
  SecurityLockIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { revealDelay } from "../reveal-delay";

type Tone = "neutral" | "reserved" | "settled" | "released" | "unresolved";

interface State {
  readonly label: string;
  readonly tone: Tone;
  readonly icon: IconSvgElement;
  readonly note: string;
}

const path: readonly State[] = [
  { label: "REQUESTED", tone: "neutral", icon: SentIcon, note: "An agent asks to spend" },
  { label: "POLICY CHECKED", tone: "neutral", icon: CheckListIcon, note: "Every rule passes" },
  { label: "RESERVED", tone: "reserved", icon: SecurityLockIcon, note: "Capacity is committed" },
];

const outcomes: readonly State[] = [
  {
    label: "SETTLED",
    tone: "settled",
    icon: CheckmarkBadge01Icon,
    note: "Payment confirmed on X Layer",
  },
  {
    label: "RELEASED",
    tone: "released",
    icon: ArrowTurnBackwardIcon,
    note: "Payment definitely did not happen",
  },
  {
    label: "UNRESOLVED",
    tone: "unresolved",
    icon: HelpCircleIcon,
    note: "Outcome unknown, still counts against the budget",
  },
];

function StateChip({ state }: { state: State }) {
  return (
    <div className={`state state-${state.tone}`}>
      <span className="state-chip">
        <HugeiconsIcon icon={state.icon} size={14} strokeWidth={2} aria-hidden />
        {state.label}
      </span>
      <span className="state-note">{state.note}</span>
    </div>
  );
}

export function StateMachine() {
  return (
    <figure className="flow" data-reveal style={revealDelay(0.2)}>
      <figcaption className="flow-head">
        <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={1.8} aria-hidden />
        Every authorization moves through one state machine
      </figcaption>
      <div className="flow-body">
        <ol className="flow-path">
          {path.map((state) => (
            <li key={state.label}>
              <StateChip state={state} />
              <HugeiconsIcon
                className="flow-arrow"
                icon={ArrowRight02Icon}
                size={18}
                strokeWidth={1.6}
                aria-hidden
              />
            </li>
          ))}
        </ol>
        <ul className="flow-outcomes" aria-label="Possible outcomes of a reservation">
          {outcomes.map((state) => (
            <li key={state.label}>
              <StateChip state={state} />
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
