import { useState } from "react";
import { primaryButton } from "@/components/feedback/button-styles";
import { Field, TextInput } from "./field";
import { ServiceChips } from "./service-chips";
import { Toggle } from "./toggle";
import {
  emptyJobForm,
  validateJobForm,
  type JobFormErrors,
  type JobFormField,
  type JobFormValues,
} from "./validate";

const invalidFieldOrder: readonly JobFormField[] = [
  "title",
  "customer",
  "maxBudget",
  "maxPerPurchase",
  "revenue",
  "allowedServices",
  "expiryMinutes",
];

const fieldId = (key: JobFormField): string =>
  key === "allowedServices" ? "job-services" : `job-${key}`;

type TextKey = {
  [K in keyof JobFormValues]: JobFormValues[K] extends string ? K : never;
}[keyof JobFormValues];

interface TextOptions {
  readonly hint?: string;
  readonly placeholder?: string;
  readonly mode?: "decimal" | "numeric";
}

export function JobForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (values: JobFormValues) => void;
}) {
  const [values, setValues] = useState<JobFormValues>(emptyJobForm);
  const [errors, setErrors] = useState<JobFormErrors>({});

  const set = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const text = (key: TextKey, label: string, extra: TextOptions) => {
    const value = values[key];
    return (
      <Field
        id={`job-${key}`}
        label={label}
        error={errors[key]}
        {...(extra.hint ? { hint: extra.hint } : {})}
      >
        <TextInput
          id={`job-${key}`}
          value={value}
          onChange={(next) => {
            set(key, next);
          }}
          error={errors[key]}
          hint={extra.hint !== undefined}
          inputMode={extra.mode ?? "text"}
          mono={extra.mode === "decimal"}
          {...(extra.placeholder ? { placeholder: extra.placeholder } : {})}
        />
      </Field>
    );
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const found = validateJobForm(values);
        setErrors(found);
        const firstInvalid = invalidFieldOrder.find((key) => found[key] !== undefined);
        if (firstInvalid === undefined) onSubmit(values);
        else document.getElementById(fieldId(firstInvalid))?.focus();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {text("title", "Title", { placeholder: "Competitor intelligence" })}
        {text("customer", "Customer", { placeholder: "ACME" })}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {text("maxBudget", "Budget (USDT)", { placeholder: "1.00", mode: "decimal" })}
        {text("maxPerPurchase", "Per-purchase limit (USDT)", {
          placeholder: "0.50",
          mode: "decimal",
        })}
        {text("revenue", "Revenue (USDT, optional)", {
          hint: "What the customer pays for the job.",
          mode: "decimal",
        })}
      </div>
      <Field
        id="job-services"
        label="Allowed services"
        hint="Press Enter to add each service agents may pay for."
        error={errors.allowedServices}
      >
        <ServiceChips
          id="job-services"
          services={values.allowedServices}
          onChange={(next) => {
            set("allowedServices", next);
          }}
          error={errors.allowedServices}
        />
      </Field>
      <div className="max-w-xs">
        {text("expiryMinutes", "Expires in (minutes)", {
          hint: "Counted from when you create the job.",
          mode: "numeric",
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          id="job-delegation"
          label="Allow delegation"
          description="Agents may start child agents that draw from this same budget."
          checked={values.delegationAllowed}
          onChange={(next) => {
            set("delegationAllowed", next);
          }}
        />
        <Toggle
          id="job-demo"
          label="Demo data"
          description="Label this job as demo data everywhere it appears."
          checked={values.isDemoData}
          onChange={(next) => {
            set("isDemoData", next);
          }}
        />
      </div>
      <div>
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? "Creating job…" : "Create job"}
        </button>
      </div>
    </form>
  );
}
