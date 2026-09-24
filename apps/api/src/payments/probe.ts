import { HttpError } from "../http/errors";
import { chooseTerms, paymentRequiredHeader, type PaymentTerms } from "./x402";

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function rejected(message: string): HttpError {
  return new HttpError(422, "PAYMENT_TERMS_REJECTED", message);
}

export async function probeTerms(
  url: string,
  maxAmountMicros: number,
  timeoutMs: number,
): Promise<PaymentTerms> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: "manual" });
  } catch (error) {
    throw new HttpError(502, "SELLER_UNREACHABLE", `Probing ${url} failed: ${messageOf(error)}`);
  }
  await response.body?.cancel();
  if (response.status !== 402) {
    throw rejected(`${url} answered ${String(response.status)} without payment, expected 402`);
  }
  const paymentRequired = response.headers.get(paymentRequiredHeader);
  if (paymentRequired === null) {
    throw rejected(`${url} answered 402 without a ${paymentRequiredHeader} header`);
  }
  const decision = chooseTerms(paymentRequired, maxAmountMicros);
  if (!decision.accepted) {
    throw rejected(decision.reason);
  }
  return decision.terms;
}
