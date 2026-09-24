import type { DenialReason } from "@reins/core";

export const denialExplanations: Record<DenialReason, string> = {
  JOB_NOT_ACTIVE: "The job is no longer active, so no new spending is authorized.",
  JOB_EXPIRED: "The job had passed its expiry time.",
  SERVICE_NOT_ALLOWED: "This service is not on the job's list of allowed services.",
  PER_PURCHASE_LIMIT_EXCEEDED: "The amount is above the job's per-purchase limit.",
  AGENT_NOT_IN_JOB: "The requesting agent does not belong to this job.",
  AGENT_REVOKED: "The requesting agent's authority had been revoked.",
  JOB_BUDGET_EXCEEDED: "Insufficient job budget capacity for this purchase.",
};

export const denialLabels: Record<DenialReason, string> = {
  JOB_NOT_ACTIVE: "Job no longer active",
  JOB_EXPIRED: "Job expired",
  SERVICE_NOT_ALLOWED: "Service not allowed",
  PER_PURCHASE_LIMIT_EXCEEDED: "Over per-purchase limit",
  AGENT_NOT_IN_JOB: "Agent not on the job",
  AGENT_REVOKED: "Agent revoked",
  JOB_BUDGET_EXCEEDED: "Budget capacity exhausted",
};

const timeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : timeFormat.format(date);
}

export function middleTruncate(value: string, keep = 8): string {
  if (value.length <= keep * 2 + 3) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

const shortTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatShortTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : shortTimeFormat.format(date);
}
