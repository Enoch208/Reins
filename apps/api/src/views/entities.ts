import { formatMicros, type AgentView, type AuthorizationView, type JobView } from "@reins/core";
import type { AgentRow, AuthorizationRow, JobRow } from "../db/client";
import { toBudgetView, type OutstandingMicros } from "./budget";

function iso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export function toJobView(job: JobRow, outstanding: OutstandingMicros): JobView {
  return {
    id: job.id,
    title: job.title,
    customer: job.customer,
    revenue: job.revenueMicros === null ? null : formatMicros(job.revenueMicros),
    currency: job.currency,
    maxPerPurchase: formatMicros(job.maxPerPurchaseMicros),
    allowedServices: job.allowedServices,
    expiresAt: job.expiresAt.toISOString(),
    delegationAllowed: job.delegationAllowed,
    status: job.status,
    isDemoData: job.isDemoData,
    createdAt: job.createdAt.toISOString(),
    revokedAt: iso(job.revokedAt),
    budget: toBudgetView(job, outstanding),
  };
}

export function toAgentView(agent: AgentRow): AgentView {
  return {
    id: agent.id,
    jobId: agent.jobId,
    name: agent.name,
    role: agent.role,
    parentAgentId: agent.parentAgentId,
    replacesAgentId: agent.replacesAgentId,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
    revokedAt: iso(agent.revokedAt),
  };
}

export function toAuthorizationView(authorization: AuthorizationRow): AuthorizationView {
  return {
    id: authorization.id,
    jobId: authorization.jobId,
    agentId: authorization.agentId,
    operationId: authorization.operationId,
    service: authorization.service,
    amount: formatMicros(authorization.amountMicros),
    state: authorization.state,
    txHash: authorization.txHash,
    network: authorization.network,
    deliverable: authorization.deliverable,
    createdAt: authorization.createdAt.toISOString(),
    resolutionReason: authorization.resolutionReason,
    resolvedAt: iso(authorization.resolvedAt),
  };
}
