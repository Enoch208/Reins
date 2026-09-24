import {
  apiRoutes,
  type ActivityEntryView,
  type CreateJobBody,
  type EvidenceView,
  type JobDetailView,
  type JobView,
  type LedgerEntryView,
  type OverviewView,
  type RevokeBody,
  type WalletView,
  isActivityEntryView,
  isApiError,
  isArrayOf,
  isEvidenceView,
  isJobDetailView,
  isJobView,
  isLedgerEntryView,
  isOverviewView,
  isWalletView,
} from "@reins/core";

const apiBase = "/api";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

async function send(path: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
  } catch (cause) {
    if (init.signal?.aborted) throw cause;
    throw new ApiRequestError(0, "NETWORK", "The Reins API could not be reached.");
  }
  const text = await response.text();
  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  const body: unknown = isJson && text.length > 0 ? parseJson(text, response.status) : null;
  if (!response.ok) {
    if (isApiError(body)) throw new ApiRequestError(response.status, body.error, body.message);
    if (response.status >= 502 && response.status <= 504) {
      throw new ApiRequestError(
        response.status,
        "UNREACHABLE",
        "The Reins API could not be reached.",
      );
    }
    throw new ApiRequestError(
      response.status,
      "HTTP_ERROR",
      `The Reins API answered ${String(response.status)} ${response.statusText}.`,
    );
  }
  return body;
}

function parseJson(text: string, status: number): unknown {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    throw new ApiRequestError(
      status,
      "BAD_JSON",
      "The Reins API returned a response that is not JSON.",
    );
  }
}

function expect<T>(body: unknown, guard: (value: unknown) => value is T, what: string): T {
  if (guard(body)) return body;
  throw new ApiRequestError(
    200,
    "BAD_SHAPE",
    `The Reins API returned ${what} in an unexpected shape.`,
  );
}

export async function listJobs(signal: AbortSignal): Promise<readonly JobView[]> {
  const body = await send(apiRoutes.jobs, { method: "GET", signal });
  return expect(body, isArrayOf(isJobView), "the job list");
}

export async function getJob(jobId: string, signal: AbortSignal): Promise<JobDetailView> {
  const body = await send(apiRoutes.job(jobId), { method: "GET", signal });
  return expect(body, isJobDetailView, "the job");
}

export async function getLedger(
  jobId: string,
  signal: AbortSignal,
): Promise<readonly LedgerEntryView[]> {
  const body = await send(apiRoutes.ledger(jobId), { method: "GET", signal });
  return expect(body, isArrayOf(isLedgerEntryView), "the ledger");
}

export async function getEvidence(jobId: string, signal: AbortSignal): Promise<EvidenceView> {
  const body = await send(apiRoutes.evidence(jobId), { method: "GET", signal });
  return expect(body, isEvidenceView, "the evidence");
}

export async function createJob(input: CreateJobBody): Promise<JobView> {
  const body = await send(apiRoutes.jobs, { method: "POST", body: JSON.stringify(input) });
  return expect(body, isJobView, "the new job");
}

export async function revoke(jobId: string, input: RevokeBody): Promise<void> {
  await send(apiRoutes.revoke(jobId), { method: "POST", body: JSON.stringify(input) });
}

export async function getOverview(signal: AbortSignal): Promise<OverviewView> {
  const body = await send(apiRoutes.overview, { method: "GET", signal });
  return expect(body, isOverviewView, "the overview");
}

export async function listActivity(signal: AbortSignal): Promise<readonly ActivityEntryView[]> {
  const body = await send(apiRoutes.activity, { method: "GET", signal });
  return expect(body, isArrayOf(isActivityEntryView), "the activity feed");
}

export async function getWallet(signal: AbortSignal): Promise<WalletView> {
  const body = await send(apiRoutes.wallet, { method: "GET", signal });
  return expect(body, isWalletView, "the wallet");
}
