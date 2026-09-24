import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export const inputClass =
  "w-full rounded-[12px] border bg-white/80 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint focus:border-accent focus:outline-none";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-denied-ink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-caption">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  error,
  hint,
  inputMode,
  placeholder,
  mono,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
  hint?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
  mono?: boolean;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <input
      id={id}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      inputMode={inputMode ?? "text"}
      placeholder={placeholder}
      aria-invalid={error !== undefined}
      aria-describedby={describedBy}
      className={cx(
        inputClass,
        error ? "border-denied" : "border-line",
        mono && "font-mono tabular-nums",
      )}
    />
  );
}
