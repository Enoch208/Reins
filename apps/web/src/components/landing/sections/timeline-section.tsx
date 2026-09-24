import {
  CheckmarkBadge01Icon,
  HierarchyIcon,
  SecurityLockIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@/lib/cx";
import { revealDelay } from "../reveal-delay";
import { StateMachine } from "./state-machine";

const steps = [
  {
    title: "Fund",
    icon: Wallet01Icon,
    body: "Set the revenue, a spend ceiling, a per-purchase limit, the allowed services and an expiry.",
  },
  {
    title: "Delegate",
    icon: HierarchyIcon,
    body: "Attach a coordinator and its workers. Every one of them draws from the same job budget.",
  },
  {
    title: "Reserve",
    icon: SecurityLockIcon,
    body: "Each purchase is checked and reserved before the OKX Agentic Wallet signs anything.",
  },
  {
    title: "Settle",
    icon: CheckmarkBadge01Icon,
    body: "The X Layer receipt closes the reservation and joins the job's evidence ledger.",
  },
] as const;

export function TimelineSection() {
  return (
    <section className="section" id="how-it-works">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          How a job <span className="serif">runs</span>
          <br />
          under Reins
        </h2>
        <p className="section-sub">
          Four steps from a customer order to a settled purchase with its evidence attached.
        </p>
      </div>
      <ol className="timeline">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cx("step", index === 0 && "on")}
            data-reveal
            style={revealDelay(index === 0 ? null : index * 0.12)}
          >
            <div className="step-card">
              <span className="step-icon">
                <HugeiconsIcon icon={step.icon} size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <StateMachine />
    </section>
  );
}
