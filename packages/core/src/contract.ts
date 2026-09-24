export const currencies = ["USDT"] as const;
export type Currency = (typeof currencies)[number];

export const jobStatuses = ["ACTIVE", "REVOKED", "COMPLETED"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const agentStatuses = ["ACTIVE", "REPLACED", "REVOKED"] as const;
export type AgentStatus = (typeof agentStatuses)[number];

export const authorizationStates = ["RESERVED", "SETTLED", "RELEASED", "UNRESOLVED"] as const;
export type AuthorizationState = (typeof authorizationStates)[number];

export const spendDecisions = ["APPROVED", "DENIED"] as const;
export type SpendDecision = (typeof spendDecisions)[number];

export const denialReasons = [
  "JOB_NOT_ACTIVE",
  "JOB_EXPIRED",
  "SERVICE_NOT_ALLOWED",
  "PER_PURCHASE_LIMIT_EXCEEDED",
  "AGENT_NOT_IN_JOB",
  "AGENT_REVOKED",
  "JOB_BUDGET_EXCEEDED",
] as const;
export type DenialReason = (typeof denialReasons)[number];

export type DecimalAmount = string;

export interface SpendRequestBody {
  readonly agentId: string;
  readonly service: string;
  readonly amount: DecimalAmount;
  readonly operationId: string;
}

export interface SpendApproved {
  readonly decision: "APPROVED";
  readonly authorizationId: string;
  readonly state: AuthorizationState;
  readonly reserved: DecimalAmount;
  readonly remainingCapacity: DecimalAmount;
  readonly replayed: boolean;
}

export interface SpendDenied {
  readonly decision: "DENIED";
  readonly reason: DenialReason;
  readonly remainingCapacity: DecimalAmount;
}

export type SpendResponse = SpendApproved | SpendDenied;

export const policyChecks = [
  { reason: "JOB_NOT_ACTIVE", label: "Job active" },
  { reason: "JOB_EXPIRED", label: "Before expiry" },
  { reason: "SERVICE_NOT_ALLOWED", label: "Service permitted" },
  { reason: "PER_PURCHASE_LIMIT_EXCEEDED", label: "Under the per-purchase limit" },
  { reason: "AGENT_NOT_IN_JOB", label: "Agent belongs to the job" },
  { reason: "AGENT_REVOKED", label: "Agent authority active" },
  { reason: "JOB_BUDGET_EXCEEDED", label: "Budget capacity available" },
] as const satisfies readonly { readonly reason: DenialReason; readonly label: string }[];
