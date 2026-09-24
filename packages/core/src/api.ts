import type {
  AgentStatus,
  AuthorizationState,
  Currency,
  DecimalAmount,
  DenialReason,
  JobStatus,
  SpendDecision,
  SpendDenied,
} from "./contract";

export type IsoTimestamp = string;

export const apiRoutes = {
  jobs: "/jobs",
  job: (jobId: string) => `/jobs/${jobId}`,
  agents: (jobId: string) => `/jobs/${jobId}/agents`,
  spend: (jobId: string) => `/jobs/${jobId}/spend`,
  delegate: (jobId: string) => `/jobs/${jobId}/delegate`,
  replace: (jobId: string) => `/jobs/${jobId}/replace`,
  revoke: (jobId: string) => `/jobs/${jobId}/revoke`,
  ledger: (jobId: string) => `/jobs/${jobId}/ledger`,
  evidence: (jobId: string) => `/jobs/${jobId}/evidence`,
  settle: (authorizationId: string) => `/authorizations/${authorizationId}/settle`,
  release: (authorizationId: string) => `/authorizations/${authorizationId}/release`,
  unresolved: (authorizationId: string) => `/authorizations/${authorizationId}/unresolved`,
  reconcile: (authorizationId: string) => `/authorizations/${authorizationId}/reconcile`,
  overview: "/overview",
  activity: "/activity",
  wallet: "/wallet",
  purchase: (jobId: string) => `/jobs/${jobId}/purchase`,
} as const;

export interface CreateJobBody {
  readonly title: string;
  readonly customer: string;
  readonly revenue: DecimalAmount | null;
  readonly maxBudget: DecimalAmount;
  readonly maxPerPurchase: DecimalAmount;
  readonly allowedServices: readonly string[];
  readonly expiresAt: IsoTimestamp;
  readonly delegationAllowed: boolean;
  readonly isDemoData: boolean;
}

export interface AttachAgentBody {
  readonly name: string;
  readonly role: string;
}

export interface DelegateBody {
  readonly parentAgentId: string;
  readonly name: string;
  readonly role: string;
}

export interface ReplaceBody {
  readonly agentId: string;
  readonly name: string;
}

export interface RevokeBody {
  readonly agentId: string | null;
}

export interface SettleBody {
  readonly txHash: string;
  readonly network: string;
  readonly deliverable: string | null;
}

export interface ReleaseBody {
  readonly reason: string;
}

export interface MarkUnresolvedBody {
  readonly reason: string;
}

export interface ReconcileBody {
  readonly outcome: "SETTLED" | "RELEASED";
  readonly txHash: string | null;
  readonly network: string | null;
}

export interface BudgetView {
  readonly maxBudget: DecimalAmount;
  readonly settled: DecimalAmount;
  readonly reserved: DecimalAmount;
  readonly unresolved: DecimalAmount;
  readonly available: DecimalAmount;
}

export interface JobView {
  readonly id: string;
  readonly title: string;
  readonly customer: string;
  readonly revenue: DecimalAmount | null;
  readonly currency: Currency;
  readonly maxPerPurchase: DecimalAmount;
  readonly allowedServices: readonly string[];
  readonly expiresAt: IsoTimestamp;
  readonly delegationAllowed: boolean;
  readonly status: JobStatus;
  readonly isDemoData: boolean;
  readonly createdAt: IsoTimestamp;
  readonly revokedAt: IsoTimestamp | null;
  readonly budget: BudgetView;
}

export interface AgentView {
  readonly id: string;
  readonly jobId: string;
  readonly name: string;
  readonly role: string;
  readonly parentAgentId: string | null;
  readonly replacesAgentId: string | null;
  readonly status: AgentStatus;
  readonly createdAt: IsoTimestamp;
  readonly revokedAt: IsoTimestamp | null;
}

export interface AuthorizationView {
  readonly id: string;
  readonly jobId: string;
  readonly agentId: string;
  readonly operationId: string;
  readonly service: string;
  readonly amount: DecimalAmount;
  readonly state: AuthorizationState;
  readonly txHash: string | null;
  readonly network: string | null;
  readonly deliverable: string | null;
  readonly resolutionReason: string | null;
  readonly createdAt: IsoTimestamp;
  readonly resolvedAt: IsoTimestamp | null;
}

export interface LedgerEntryView {
  readonly id: string;
  readonly jobId: string;
  readonly agentId: string | null;
  readonly agentName: string | null;
  readonly parentAgentId: string | null;
  readonly operationId: string;
  readonly service: string;
  readonly amount: DecimalAmount;
  readonly decision: SpendDecision;
  readonly denialReason: DenialReason | null;
  readonly availableAtDecision: DecimalAmount;
  readonly authorization: AuthorizationView | null;
  readonly createdAt: IsoTimestamp;
}

export interface JobDetailView {
  readonly job: JobView;
  readonly agents: readonly AgentView[];
}

export interface EvidenceView {
  readonly job: JobView;
  readonly agents: readonly AgentView[];
  readonly entries: readonly LedgerEntryView[];
}

export interface ApiError {
  readonly error: string;
  readonly message: string;
}

export interface ActivityEntryView extends LedgerEntryView {
  readonly jobTitle: string;
}

export interface JobCounts {
  readonly total: number;
  readonly active: number;
  readonly revoked: number;
  readonly completed: number;
}

export interface DecisionCounts {
  readonly approved: number;
  readonly denied: number;
}

export interface DenialCount {
  readonly reason: DenialReason;
  readonly count: number;
}

export interface ServiceSpend {
  readonly service: string;
  readonly settled: DecimalAmount;
  readonly committed: DecimalAmount;
  readonly purchases: number;
}

export interface OverviewView {
  readonly jobs: JobCounts;
  readonly activeBudget: BudgetView;
  readonly settledAllTime: DecimalAmount;
  readonly revenue: DecimalAmount;
  readonly decisions: DecisionCounts;
  readonly denialsByReason: readonly DenialCount[];
  readonly spendByService: readonly ServiceSpend[];
  readonly recent: readonly ActivityEntryView[];
}

export const walletStatuses = ["READY", "LOGGED_OUT", "NOT_INSTALLED"] as const;
export type WalletStatus = (typeof walletStatuses)[number];

export interface WalletView {
  readonly status: WalletStatus;
  readonly network: string;
  readonly networkName: string;
  readonly asset: string;
  readonly address: string | null;
  readonly balance: DecimalAmount | null;
  readonly explorerUrl: string | null;
}

export interface PurchaseRequestBody {
  readonly agentId: string;
  readonly service: string;
  readonly operationId: string;
  readonly url: string;
  readonly maxAmount: DecimalAmount;
}

export const paymentOutcomes = ["SETTLED", "RELEASED", "UNRESOLVED"] as const;
export type PaymentOutcome = (typeof paymentOutcomes)[number];

export interface PurchaseApproved {
  readonly decision: "APPROVED";
  readonly replayed: boolean;
  readonly outcome: PaymentOutcome;
  readonly authorization: AuthorizationView;
  readonly remainingCapacity: DecimalAmount;
  readonly deliverable: string | null;
}

export type PurchaseResponse = PurchaseApproved | SpendDenied;
