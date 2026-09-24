import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { secondaryButton } from "@/components/feedback/button-styles";
import { cx } from "@/lib/cx";
import { inputClass } from "./field";

export function ServiceChips({
  id,
  services,
  onChange,
  error,
}: {
  id: string;
  services: readonly string[];
  onChange: (services: readonly string[]) => void;
  error: string | undefined;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const service = draft.trim();
    if (service.length === 0) return;
    if (!services.includes(service)) onChange([...services, service]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
          placeholder="market-data-provider"
          aria-invalid={error !== undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className={cx(inputClass, "font-mono text-sm", error ? "border-denied" : "border-line")}
        />
        <button type="button" onClick={add} className={secondaryButton}>
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>
      {services.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Allowed services">
          {services.map((service) => (
            <li
              key={service}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-tint py-1 pr-1 pl-3 font-mono text-[13px] text-accent-ink"
            >
              {service}
              <button
                type="button"
                aria-label={`Remove ${service}`}
                onClick={() => {
                  onChange(services.filter((item) => item !== service));
                }}
                className="rounded-full p-1 transition-colors hover:bg-white/80"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.2} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
