import { cx } from "@/lib/cx";

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-[16px] border border-line bg-white/50 px-4 py-3.5">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-ink">
          {label}
        </p>
        <p id={`${id}-description`} className="mt-0.5 text-sm text-caption">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        onClick={() => {
          onChange(!checked);
        }}
        className={cx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-accent bg-accent" : "border-line bg-released-tint",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-[left] motion-reduce:transition-none",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
