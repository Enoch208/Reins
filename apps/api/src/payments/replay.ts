import { messageOf } from "./probe";
import { decodePaymentReceipt, paymentResponseHeader, paymentSignatureHeader } from "./x402";
import { xLayerNetwork } from "./xlayer";

export type ReplayOutcome =
  | { readonly kind: "UNDELIVERED"; readonly reason: string }
  | { readonly kind: "UNKNOWN"; readonly reason: string; readonly txHash: string | null }
  | { readonly kind: "PAID"; readonly txHash: string; readonly body: string };

type Failure = Exclude<ReplayOutcome, { readonly kind: "PAID" }>;

const undeliveredCodes = new Set(["ECONNREFUSED", "ENOTFOUND"]);

function connectionCode(error: unknown): string | null {
  if (!(error instanceof TypeError)) {
    return null;
  }
  const cause: unknown = error.cause;
  if (typeof cause !== "object" || cause === null || !("code" in cause)) {
    return null;
  }
  return typeof cause.code === "string" ? cause.code : null;
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

function failure(error: unknown, timeoutMs: number): Failure {
  const code = connectionCode(error);
  if (code !== null && undeliveredCodes.has(code)) {
    return {
      kind: "UNDELIVERED",
      reason: `The seller refused the connection (${code}); the signed authorization was never delivered`,
    };
  }
  const reason = isTimeout(error)
    ? `The seller did not answer within ${String(timeoutMs)} ms after receiving the signed authorization`
    : `The paid request failed after sending the signed authorization: ${messageOf(error)}`;
  return { kind: "UNKNOWN", reason, txHash: null };
}

export async function replayWithSignature(
  url: string,
  paymentSignature: string,
  timeoutMs: number,
): Promise<ReplayOutcome> {
  try {
    const response = await fetch(url, {
      headers: { [paymentSignatureHeader]: paymentSignature },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "manual",
    });
    const header = response.headers.get(paymentResponseHeader);
    const receipt = header === null ? null : decodePaymentReceipt(header);
    const txHash =
      receipt?.success === true && receipt.transaction !== "" ? receipt.transaction : null;
    if (!response.ok) {
      await response.body?.cancel();
      return {
        kind: "UNKNOWN",
        reason: `The seller answered ${String(response.status)} after receiving the signed authorization${receipt?.errorReason ? `: ${receipt.errorReason}` : ""}`,
        txHash,
      };
    }
    if (txHash === null || receipt?.network !== xLayerNetwork) {
      await response.body?.cancel();
      return {
        kind: "UNKNOWN",
        reason: `The seller answered ${String(response.status)} without a successful ${xLayerNetwork} settlement receipt`,
        txHash,
      };
    }
    return await readDeliverable(response, txHash, timeoutMs);
  } catch (error) {
    return failure(error, timeoutMs);
  }
}

async function readDeliverable(
  response: Response,
  txHash: string,
  timeoutMs: number,
): Promise<ReplayOutcome> {
  try {
    return { kind: "PAID", txHash, body: await response.text() };
  } catch (error) {
    const unknown = failure(error, timeoutMs);
    return { kind: "UNKNOWN", reason: unknown.reason, txHash };
  }
}
