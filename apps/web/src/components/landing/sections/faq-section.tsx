import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { cx } from "@/lib/cx";
import { revealDelay } from "../reveal-delay";

const questions = [
  {
    question: "Does Reins hold our private keys?",
    answer:
      "No. Key custody, signing and payment execution stay with the OKX Agentic Wallet. Reins decides whether a purchase may happen and reserves budget for it before the wallet acts. It never signs a transaction.",
  },
  {
    question: "What happens when a payment times out?",
    answer:
      "The reservation becomes unresolved and keeps counting against the job budget. Reins never assumes a timeout means no money moved. Reconciliation later settles or releases it against the X Layer record.",
  },
  {
    question: "Can a retry charge us twice?",
    answer:
      "No. Every purchase carries an operation ID. A retry with the same ID gets back the original decision and authorization instead of a second reservation.",
  },
  {
    question: "What does revoking a job actually do?",
    answer:
      "It blocks every new authorization immediately. Reservations that were already committed stay on the ledger, because withdrawing authority does not make committed money disappear.",
  },
  {
    question: "How do delegated or replacement agents get a budget?",
    answer:
      "They do not get their own. Authority belongs to the job, so every child agent and every replacement worker draws from whatever the job has left.",
  },
  {
    question: "Where does settlement happen?",
    answer:
      "On X Layer. Each settled purchase links its transaction to the job, the agent, the policy decision and the deliverable it paid for.",
  },
] as const;

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section className="faq" id="faq">
      <div className="faq-head" data-reveal>
        <h2 className="q-title">
          Still have
          <br />
          <span className="serif">unanswered</span> questions?
        </h2>
        <button
          type="button"
          className="q-arrow"
          aria-label="Scroll to contact"
          onClick={() => {
            document.getElementById("contact")?.scrollIntoView({ block: "start" });
          }}
        >
          <HugeiconsIcon icon={ArrowDown02Icon} size={26} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <div className="faq-list" data-reveal style={revealDelay(0.14)}>
        {questions.map((item, index) => {
          const isOpen = open === index;
          const panelId = `${baseId}-answer-${String(index)}`;
          return (
            <div key={item.question} className={cx("faq-item", isOpen && "is-open")}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpen(isOpen ? null : index);
                }}
              >
                {item.question}
                <span className="faq-sign" aria-hidden />
              </button>
              <div className="faq-a" id={panelId} role="region" inert={!isOpen}>
                <div>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
