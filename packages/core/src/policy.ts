import type { AgentStatus, DenialReason, JobStatus } from "./contract";
import { policyChecks } from "./contract";

export interface PolicyJob {
  readonly id: string;
  readonly status: JobStatus;
  readonly expiresAt: Date;
  readonly allowedServices: readonly string[];
  readonly maxPerPurchaseMicros: number;
  readonly availableMicros: number;
}

export interface PolicyAgent {
  readonly jobId: string;
  readonly status: AgentStatus;
}

export interface PolicyRequest {
  readonly service: string;
  readonly amountMicros: number;
}

export interface PolicyInput<Agent extends PolicyAgent = PolicyAgent> {
  readonly job: PolicyJob;
  readonly agent: Agent | null;
  readonly request: PolicyRequest;
  readonly now: Date;
}

export type PolicyResult<Agent extends PolicyAgent = PolicyAgent> =
  | { readonly allowed: true; readonly agent: Agent }
  | { readonly allowed: false; readonly reason: DenialReason };

const passes: Record<DenialReason, (input: PolicyInput) => boolean> = {
  JOB_NOT_ACTIVE: ({ job }) => job.status === "ACTIVE",
  JOB_EXPIRED: ({ job, now }) => now.getTime() < job.expiresAt.getTime(),
  SERVICE_NOT_ALLOWED: ({ job, request }) => job.allowedServices.includes(request.service),
  PER_PURCHASE_LIMIT_EXCEEDED: ({ job, request }) =>
    request.amountMicros <= job.maxPerPurchaseMicros,
  AGENT_NOT_IN_JOB: ({ job, agent }) => agent !== null && agent.jobId === job.id,
  AGENT_REVOKED: ({ agent }) => agent !== null && agent.status === "ACTIVE",
  JOB_BUDGET_EXCEEDED: ({ job, request }) => request.amountMicros <= job.availableMicros,
};

export function evaluatePolicy<Agent extends PolicyAgent>(
  input: PolicyInput<Agent>,
): PolicyResult<Agent> {
  for (const check of policyChecks) {
    if (!passes[check.reason](input)) {
      return { allowed: false, reason: check.reason };
    }
  }
  if (input.agent === null) {
    return { allowed: false, reason: "AGENT_NOT_IN_JOB" };
  }
  return { allowed: true, agent: input.agent };
}
