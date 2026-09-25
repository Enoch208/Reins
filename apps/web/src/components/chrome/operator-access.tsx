import { Key01Icon, LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type SyntheticEvent } from "react";
import { saveOperatorKey, useOperatorKey } from "@/lib/operator-key";

const minimumLength = 32;

export function OperatorAccess() {
  const key = useOperatorKey();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (draft.trim().length < minimumLength) return;
    saveOperatorKey(draft.trim());
    setDraft("");
    setEditing(false);
  };

  if (key !== null) {
    return (
      <div className="flex items-center justify-between rounded-[14px] border border-line/80 bg-white/55 px-3.5 py-2.5 text-[13px]">
        <span className="flex items-center gap-2 font-medium text-ink">
          <HugeiconsIcon icon={Key01Icon} size={16} strokeWidth={1.8} aria-hidden />
          Operator access on
        </span>
        <button
          type="button"
          onClick={() => {
            saveOperatorKey(null);
          }}
          className="rounded-[8px] px-2 py-1 text-caption transition-colors hover:bg-white hover:text-ink"
        >
          Lock
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setEditing(true);
        }}
        className="flex w-full items-center gap-2 rounded-[14px] border border-dashed border-line px-3.5 py-2.5 text-[13px] text-muted transition-colors hover:bg-white/60 hover:text-ink"
      >
        <HugeiconsIcon icon={LockKeyIcon} size={16} strokeWidth={1.8} aria-hidden />
        View only · add operator key
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-[14px] border border-line/80 bg-white/70 p-3"
    >
      <label htmlFor="operator-key" className="text-xs font-medium text-caption">
        Operator key
      </label>
      <input
        id="operator-key"
        type="password"
        autoComplete="off"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        className="rounded-[10px] border border-line bg-white px-3 py-2 font-mono text-xs text-ink"
      />
      <p className="text-[11px] leading-snug text-caption">
        Kept only in this browser. Needed to create jobs, revoke or buy.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={draft.trim().length < minimumLength}
          className="flex-1 rounded-[10px] bg-cta px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
        >
          Unlock
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft("");
          }}
          className="rounded-[10px] px-3 py-2 text-xs text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
