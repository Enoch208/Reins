import { parseMicros, type CreateJobBody } from "@reins/core";

export interface JobFormValues {
  readonly title: string;
  readonly customer: string;
  readonly revenue: string;
  readonly maxBudget: string;
  readonly maxPerPurchase: string;
  readonly allowedServices: readonly string[];
  readonly expiryMinutes: string;
  readonly delegationAllowed: boolean;
  readonly isDemoData: boolean;
}

export type JobFormField = Exclude<keyof JobFormValues, "delegationAllowed" | "isDemoData">;
export type JobFormErrors = Partial<Record<JobFormField, string>>;

export const emptyJobForm: JobFormValues = {
  title: "",
  customer: "",
  revenue: "",
  maxBudget: "",
  maxPerPurchase: "",
  allowedServices: [],
  expiryMinutes: "60",
  delegationAllowed: true,
  isDemoData: false,
};

const amountHint = "Use a USDT amount like 1.00, with at most 6 decimals.";

function positiveAmountError(value: string): string | null {
  const micros = parseMicros(value.trim());
  if (micros === null) return amountHint;
  if (micros === 0) return "Must be greater than zero.";
  return null;
}

export function validateJobForm(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {};
  if (values.title.trim().length === 0) errors.title = "Give the job a title.";
  if (values.customer.trim().length === 0) errors.customer = "Name the customer.";
  if (values.revenue.trim().length > 0 && parseMicros(values.revenue.trim()) === null) {
    errors.revenue = amountHint;
  }
  const budgetError = positiveAmountError(values.maxBudget);
  if (budgetError) errors.maxBudget = budgetError;
  const limitError = positiveAmountError(values.maxPerPurchase);
  if (limitError) errors.maxPerPurchase = limitError;
  const budget = parseMicros(values.maxBudget.trim());
  const limit = parseMicros(values.maxPerPurchase.trim());
  if (budget !== null && limit !== null && limit > budget) {
    errors.maxPerPurchase = "The per-purchase limit cannot exceed the budget.";
  }
  if (values.allowedServices.length === 0) errors.allowedServices = "Allow at least one service.";
  const minutes = Number(values.expiryMinutes);
  if (!Number.isInteger(minutes) || minutes < 1) {
    errors.expiryMinutes = "Enter a whole number of minutes, at least 1.";
  }
  return errors;
}

export function toCreateJobBody(values: JobFormValues, now: number): CreateJobBody {
  const revenue = values.revenue.trim();
  return {
    title: values.title.trim(),
    customer: values.customer.trim(),
    revenue: revenue.length > 0 ? revenue : null,
    maxBudget: values.maxBudget.trim(),
    maxPerPurchase: values.maxPerPurchase.trim(),
    allowedServices: values.allowedServices,
    expiresAt: new Date(now + Number(values.expiryMinutes) * 60_000).toISOString(),
    delegationAllowed: values.delegationAllowed,
    isDemoData: values.isDemoData,
  };
}
