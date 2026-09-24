import { formatMicros, type LedgerEntryView } from "@reins/core";
import type { AgentRow, AuthorizationRow, SpendRequestRow } from "../db/client";
import { toAuthorizationView } from "./entities";

export interface LedgerRow {
  readonly request: SpendRequestRow;
  readonly agent: AgentRow | null;
  readonly authorization: AuthorizationRow | null;
}

export function toLedgerEntryView({ request, agent, authorization }: LedgerRow): LedgerEntryView {
  return {
    id: request.id,
    jobId: request.jobId,
    agentId: request.agentId,
    agentName: agent === null ? null : agent.name,
    parentAgentId: agent === null ? null : agent.parentAgentId,
    operationId: request.operationId,
    service: request.service,
    amount: formatMicros(request.amountMicros),
    decision: request.decision,
    denialReason: request.denialReason,
    availableAtDecision: formatMicros(request.availableMicros),
    authorization: authorization === null ? null : toAuthorizationView(authorization),
    createdAt: request.createdAt.toISOString(),
  };
}
