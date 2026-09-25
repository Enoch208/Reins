import {
  apiRoutes,
  type AgentView,
  type AttachAgentBody,
  type AuthorizationView,
  type CreateJobBody,
  type DelegateBody,
  type EvidenceView,
  type JobDetailView,
  type JobView,
  type LedgerEntryView,
  type MarkUnresolvedBody,
  type ReconcileBody,
  type ReleaseBody,
  type ReplaceBody,
  type RevokeBody,
  type SettleBody,
  type SpendRequestBody,
  type SpendResponse,
  type PurchaseRequestBody,
  type PurchaseResponse,
  type WalletView,
  type Guard,
  isAgentView,
  isApiError,
  isArrayOf,
  isAuthorizationView,
  isEvidenceView,
  isJobDetailView,
  isJobView,
  isLedgerEntryView,
  isSpendResponse,
  isPurchaseResponse,
  isWalletView,
} from "@reins/core";

export interface FailedRequest {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly requestBody: object | null;
}

export class ReinsApiError extends Error {
  override readonly name = "ReinsApiError";
  readonly request: FailedRequest;

  constructor(request: FailedRequest) {
    const body = request.requestBody === null ? "" : ` body ${JSON.stringify(request.requestBody)}`;
    super(
      `${request.method} ${request.path}${body} -> HTTP ${String(request.status)} ${request.code}: ${request.message}`,
    );
    this.request = request;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ReinsClient {
  private readonly baseUrl: string;
  private readonly operatorKey: string | null;

  constructor(baseUrl: string, operatorKey: string | null) {
    this.baseUrl = baseUrl;
    this.operatorKey = operatorKey;
  }

  listJobs(): Promise<readonly JobView[]> {
    return this.request("GET", apiRoutes.jobs, null, isArrayOf(isJobView));
  }

  createJob(body: CreateJobBody): Promise<JobView> {
    return this.request("POST", apiRoutes.jobs, body, isJobView);
  }

  getJob(jobId: string): Promise<JobDetailView> {
    return this.request("GET", apiRoutes.job(jobId), null, isJobDetailView);
  }

  attachAgent(jobId: string, body: AttachAgentBody): Promise<AgentView> {
    return this.request("POST", apiRoutes.agents(jobId), body, isAgentView);
  }

  spend(jobId: string, body: SpendRequestBody): Promise<SpendResponse> {
    return this.request("POST", apiRoutes.spend(jobId), body, isSpendResponse);
  }

  purchase(jobId: string, body: PurchaseRequestBody): Promise<PurchaseResponse> {
    return this.request("POST", apiRoutes.purchase(jobId), body, isPurchaseResponse);
  }

  wallet(): Promise<WalletView> {
    return this.request("GET", apiRoutes.wallet, null, isWalletView);
  }

  delegate(jobId: string, body: DelegateBody): Promise<AgentView> {
    return this.request("POST", apiRoutes.delegate(jobId), body, isAgentView);
  }

  replace(jobId: string, body: ReplaceBody): Promise<AgentView> {
    return this.request("POST", apiRoutes.replace(jobId), body, isAgentView);
  }

  revoke(jobId: string, body: RevokeBody): Promise<JobDetailView> {
    return this.request("POST", apiRoutes.revoke(jobId), body, isJobDetailView);
  }

  ledger(jobId: string): Promise<readonly LedgerEntryView[]> {
    return this.request("GET", apiRoutes.ledger(jobId), null, isArrayOf(isLedgerEntryView));
  }

  evidence(jobId: string): Promise<EvidenceView> {
    return this.request("GET", apiRoutes.evidence(jobId), null, isEvidenceView);
  }

  settle(authorizationId: string, body: SettleBody): Promise<AuthorizationView> {
    return this.request("POST", apiRoutes.settle(authorizationId), body, isAuthorizationView);
  }

  release(authorizationId: string, body: ReleaseBody): Promise<AuthorizationView> {
    return this.request("POST", apiRoutes.release(authorizationId), body, isAuthorizationView);
  }

  markUnresolved(authorizationId: string, body: MarkUnresolvedBody): Promise<AuthorizationView> {
    return this.request("POST", apiRoutes.unresolved(authorizationId), body, isAuthorizationView);
  }

  reconcile(authorizationId: string, body: ReconcileBody): Promise<AuthorizationView> {
    return this.request("POST", apiRoutes.reconcile(authorizationId), body, isAuthorizationView);
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body: object | null,
    guard: Guard<T>,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== null) headers["content-type"] = "application/json";
    if (this.operatorKey !== null) headers.authorization = `Bearer ${this.operatorKey}`;
    const init: RequestInit =
      body === null ? { method, headers } : { method, headers, body: JSON.stringify(body) };
    const response = await fetch(new URL(path, this.baseUrl), init);
    const payload = await readBody(response);
    if (!response.ok) {
      const code = isApiError(payload) ? payload.error : "HTTP_ERROR";
      const message = isApiError(payload) ? payload.message : JSON.stringify(payload);
      throw new ReinsApiError({
        method,
        path,
        status: response.status,
        code,
        message,
        requestBody: body,
      });
    }
    if (!guard(payload)) {
      throw new ReinsApiError({
        method,
        path,
        status: response.status,
        code: "UNEXPECTED_RESPONSE",
        message: `Response does not match the contract: ${JSON.stringify(payload)}`,
        requestBody: body,
      });
    }
    return payload;
  }
}
