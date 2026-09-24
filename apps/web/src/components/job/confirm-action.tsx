import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import {
  dangerButton,
  dangerSolidButton,
  secondaryButton,
} from "@/components/feedback/button-styles";

export function ConfirmAction({
  icon,
  label,
  accessibleLabel,
  question,
  confirmLabel,
  onConfirm,
}: {
  icon: IconSvgElement;
  label: string;
  accessibleLabel?: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [stage, setStage] = useState<"idle" | "confirming" | "working">("idle");
  const [error, setError] = useState<string | null>(null);
  const questionId = useId();

  if (stage === "idle") {
    return (
      <button
        type="button"
        aria-label={accessibleLabel ?? label}
        onClick={() => {
          setError(null);
          setStage("confirming");
        }}
        className={dangerButton}
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.9} aria-hidden />
        {label}
      </button>
    );
  }

  const confirm = () => {
    setStage("working");
    void onConfirm().then(
      () => {
        setStage("idle");
      },
      (cause: unknown) => {
        setStage("confirming");
        setError(cause instanceof Error ? cause.message : String(cause));
      },
    );
  };

  return (
    <div
      role="group"
      aria-labelledby={questionId}
      className="flex flex-col gap-2 rounded-[14px] border border-denied/40 bg-denied-tint/70 p-3"
    >
      <p id={questionId} className="text-sm font-medium text-denied-ink">
        {question}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          autoFocus
          disabled={stage === "working"}
          onClick={confirm}
          className={dangerSolidButton}
        >
          {stage === "working" ? "Revoking…" : confirmLabel}
        </button>
        <button
          type="button"
          disabled={stage === "working"}
          onClick={() => {
            setStage("idle");
          }}
          className={secondaryButton}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-denied-ink">
          {error}
        </p>
      )}
    </div>
  );
}
