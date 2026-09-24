import type {
  ActivityEntryView,
  OverviewView,
  PurchaseResponse,
  WalletView,
  AgentView,
  ApiError,
  AuthorizationView,
  BudgetView,
  EvidenceView,
  JobDetailView,
  JobView,
  LedgerEntryView,
} from "./api";
import { paymentOutcomes, walletStatuses } from "./api";
import {
  agentStatuses,
  authorizationStates,
  currencies,
  denialReasons,
  jobStatuses,
  spendDecisions,
  type SpendResponse,
} from "./contract";
import { parseMicros } from "./money";

export type Guard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOneOf<T extends string>(options: readonly T[]): Guard<T> {
  return (value: unknown): value is T => options.some((option) => option === value);
}

function hasFields(value: unknown, fields: Record<string, (field: unknown) => boolean>): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(fields).every(([key, guard]) => guard(value[key]));
}

export function isArrayOf<T>(guard: Guard<T>): Guard<readonly T[]> {
  return (value: unknown): value is readonly T[] => Array.isArray(value) && value.every(guard);
}

const isAmount = (value: unknown): boolean => isString(value) && parseMicros(value) !== null;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

export function isApiError(value: unknown): value is ApiError {
  return hasFields(value, { error: isString, message: isString });
}

export function isBudgetView(value: unknown): value is BudgetView {
  return hasFields(value, {
    maxBudget: isAmount,
    settled: isAmount,
    reserved: isAmount,
    unresolved: isAmount,
    available: isAmount,
  });
}

export function isJobView(value: unknown): value is JobView {
  return hasFields(value, {
    id: isString,
    title: isString,
    customer: isString,
    revenue: (field: unknown) => field === null || isAmount(field),
    currency: isOneOf(currencies),
    maxPerPurchase: isAmount,
    allowedServices: isArrayOf(isString),
    expiresAt: isString,
    delegationAllowed: isBoolean,
    status: isOneOf(jobStatuses),
    isDemoData: isBoolean,
    createdAt: isString,
    revokedAt: isNullableString,
    budget: isBudgetView,
  });
}

export function isAgentView(value: unknown): value is AgentView {
  return hasFields(value, {
    id: isString,
    jobId: isString,
    name: isString,
    role: isString,
    parentAgentId: isNullableString,
    replacesAgentId: isNullableString,
    status: isOneOf(agentStatuses),
    createdAt: isString,
    revokedAt: isNullableString,
  });
}

export function isAuthorizationView(value: unknown): value is AuthorizationView {
  return hasFields(value, {
    id: isString,
    jobId: isString,
    agentId: isString,
    operationId: isString,
    service: isString,
    amount: isAmount,
    state: isOneOf(authorizationStates),
    txHash: isNullableString,
    network: isNullableString,
    deliverable: isNullableString,
    resolutionReason: isNullableString,
    createdAt: isString,
    resolvedAt: isNullableString,
  });
}

const isDenialReasonOrNull = (value: unknown): boolean =>
  value === null || isOneOf(denialReasons)(value);

export function isLedgerEntryView(value: unknown): value is LedgerEntryView {
  return hasFields(value, {
    id: isString,
    jobId: isString,
    agentId: isNullableString,
    agentName: isNullableString,
    parentAgentId: isNullableString,
    operationId: isString,
    service: isString,
    amount: isAmount,
    decision: isOneOf(spendDecisions),
    denialReason: isDenialReasonOrNull,
    availableAtDecision: isAmount,
    authorization: (field: unknown) => field === null || isAuthorizationView(field),
    createdAt: isString,
  });
}

export function isJobDetailView(value: unknown): value is JobDetailView {
  return hasFields(value, { job: isJobView, agents: isArrayOf(isAgentView) });
}

export function isEvidenceView(value: unknown): value is EvidenceView {
  return hasFields(value, {
    job: isJobView,
    agents: isArrayOf(isAgentView),
    entries: isArrayOf(isLedgerEntryView),
  });
}

export function isSpendResponse(value: unknown): value is SpendResponse {
  if (!isRecord(value)) return false;
  if (value.decision === "APPROVED") {
    return hasFields(value, {
      authorizationId: isString,
      state: isOneOf(authorizationStates),
      reserved: isAmount,
      remainingCapacity: isAmount,
      replayed: isBoolean,
    });
  }
  return (
    value.decision === "DENIED" &&
    hasFields(value, { reason: isOneOf(denialReasons), remainingCapacity: isAmount })
  );
}

const isCount = (value: unknown): boolean =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function isActivityEntryView(value: unknown): value is ActivityEntryView {
  return isLedgerEntryView(value) && hasFields(value, { jobTitle: isString });
}

export function isOverviewView(value: unknown): value is OverviewView {
  return hasFields(value, {
    jobs: (field: unknown) =>
      hasFields(field, { total: isCount, active: isCount, revoked: isCount, completed: isCount }),
    activeBudget: isBudgetView,
    settledAllTime: isAmount,
    revenue: isAmount,
    decisions: (field: unknown) => hasFields(field, { approved: isCount, denied: isCount }),
    denialsByReason: isArrayOf((item: unknown): item is unknown =>
      hasFields(item, { reason: isOneOf(denialReasons), count: isCount }),
    ),
    spendByService: isArrayOf((item: unknown): item is unknown =>
      hasFields(item, {
        service: isString,
        settled: isAmount,
        committed: isAmount,
        purchases: isCount,
      }),
    ),
    recent: isArrayOf(isActivityEntryView),
  });
}

export function isWalletView(value: unknown): value is WalletView {
  return hasFields(value, {
    status: isOneOf(walletStatuses),
    network: isString,
    networkName: isString,
    asset: isString,
    address: isNullableString,
    balance: (field: unknown) => field === null || isAmount(field),
    explorerUrl: isNullableString,
  });
}

export function isPurchaseResponse(value: unknown): value is PurchaseResponse {
  if (!isRecord(value)) return false;
  if (value.decision === "APPROVED") {
    return hasFields(value, {
      replayed: isBoolean,
      outcome: isOneOf(paymentOutcomes),
      authorization: isAuthorizationView,
      remainingCapacity: isAmount,
      deliverable: isNullableString,
    });
  }
  return (
    value.decision === "DENIED" &&
    hasFields(value, { reason: isOneOf(denialReasons), remainingCapacity: isAmount })
  );
}
