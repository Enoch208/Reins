import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { revealDelay } from "../reveal-delay";

type Mode = "naive" | "reins";

interface Request {
  readonly agent: string;
  readonly label: string;
  readonly remainingBefore: string;
  readonly deniedByReins: boolean;
  readonly reinsNote: string;
  readonly delay: number | null;
}

const requests: readonly Request[] = [
  {
    agent: "Research agent",
    label: "Request A",
    remainingBefore: "1.00",
    deniedByReins: false,
    reinsNote: "Reserved against the job before payment. 0.60 remains.",
    delay: 0.18,
  },
  {
    agent: "Market-data agent",
    label: "Request B",
    remainingBefore: "0.60",
    deniedByReins: false,
    reinsNote: "Reserved against the job before payment. 0.20 remains.",
    delay: null,
  },
  {
    agent: "Verification agent",
    label: "Request C",
    remainingBefore: "0.20",
    deniedByReins: true,
    reinsNote: "Only 0.20 is available, so no payment is authorized.",
    delay: 0.36,
  },
];

const naiveNote = "Checked the 1.00 balance on its own, saw enough, and paid.";

const modes: readonly (readonly [Mode, string])[] = [
  ["naive", "Without Reins"],
  ["reins", "With Reins"],
];

function checks(request: Request, mode: Mode) {
  const budgetHolds = mode === "naive" || !request.deniedByReins;
  return [
    { label: "Job active", passes: true },
    { label: "Service allowed", passes: true },
    { label: "Under the 0.50 purchase limit", passes: true },
    {
      label: mode === "naive" ? "Saw 1.00 available" : `${request.remainingBefore} available`,
      passes: budgetHolds,
    },
  ];
}

export function ProofSection() {
  const [mode, setMode] = useState<Mode>("reins");
  const overBudget = mode === "naive";

  return (
    <section className="section" id="proof">
      <div className="section-head" data-reveal>
        <h2 className="section-title">
          Three agents,
          <br />
          one <span className="serif">budget</span>
        </h2>
        <p className="section-sub">
          A worked example: a 1.00 USDT job budget, and three agents that each decide a 0.40 USDT
          purchase is reasonable at the same moment.
        </p>
        <div className="toggle" role="group" aria-label="Authorization model">
          {modes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="plans">
        {requests.map((request) => {
          const denied = mode === "reins" && request.deniedByReins;
          return (
            <article
              key={request.label}
              className={cx("plan", request.deniedByReins && "featured")}
              data-reveal
              style={revealDelay(request.delay)}
            >
              {request.deniedByReins && (
                <span className="badge is-denied">
                  {denied ? "BLOCKED BEFORE PAYMENT" : "OVERSPENDS THE JOB BUDGET"}
                </span>
              )}
              <h3>{request.agent}</h3>
              <div className="price">
                <b>0.40</b>
                <i>USDT · {request.label}</i>
              </div>
              <p>{mode === "naive" ? naiveNote : request.reinsNote}</p>
              <ul>
                {checks(request, mode).map((check) => (
                  <li key={check.label} className={cx(!check.passes && "fails")}>
                    <HugeiconsIcon
                      icon={check.passes ? Tick02Icon : Cancel01Icon}
                      size={15}
                      strokeWidth={2}
                      aria-hidden
                    />
                    {check.passes ? check.label : `${check.label}: not enough`}
                  </li>
                ))}
              </ul>
              <div
                className={cx(
                  "buy",
                  denied && "is-denied",
                  overBudget && request.deniedByReins && "is-over",
                  !denied && !(overBudget && request.deniedByReins) && "is-approved",
                )}
              >
                {denied
                  ? "Denied"
                  : overBudget && request.deniedByReins
                    ? "Approved, over budget"
                    : "Approved"}
              </div>
            </article>
          );
        })}
      </div>
      <p className={cx("plans-total", overBudget && "is-over")} aria-live="polite">
        {overBudget ? (
          <>
            Spent <b>1.20 of 1.00 USDT</b>, over budget by 0.20
          </>
        ) : (
          <>
            Committed <b>0.80 of 1.00 USDT</b>, with 0.20 still available
          </>
        )}
      </p>
    </section>
  );
}
