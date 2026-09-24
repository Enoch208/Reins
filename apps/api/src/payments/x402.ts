import { formatMicros } from "@reins/core";
import { z } from "zod";
import { sameAddress, usdt0Address, xLayerNetwork } from "./xlayer";

export const paymentRequiredHeader = "PAYMENT-REQUIRED";
export const paymentSignatureHeader = "PAYMENT-SIGNATURE";
export const paymentResponseHeader = "PAYMENT-RESPONSE";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const atomic = z.string().regex(/^[0-9]+$/);

const acceptsSchema = z.object({
  scheme: z.string(),
  network: z.string(),
  amount: atomic,
  asset: address,
  payTo: address,
  maxTimeoutSeconds: z.number().int().positive(),
});

const paymentRequiredSchema = z.object({
  x402Version: z.literal(2),
  accepts: z.array(z.unknown()).min(1),
});

const signedPaymentSchema = z.object({
  x402Version: z.literal(2),
  payload: z.object({
    signature: z.string().min(1),
    authorization: z.object({
      from: address,
      to: address,
      value: atomic,
      validAfter: atomic,
      validBefore: atomic,
      nonce: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    }),
  }),
});

const paymentResponseSchema = z.object({
  success: z.boolean(),
  transaction: z.string(),
  network: z.string(),
  payer: z.string().optional(),
  errorReason: z.string().nullish(),
});

export type SignedAuthorization = z.output<typeof signedPaymentSchema>["payload"]["authorization"];
export type PaymentReceipt = z.output<typeof paymentResponseSchema>;

export interface PaymentTerms {
  readonly paymentRequired: string;
  readonly index: number;
  readonly amountMicros: number;
  readonly payTo: string;
  readonly maxTimeoutSeconds: number;
}

export type TermsDecision =
  | { readonly accepted: true; readonly terms: PaymentTerms }
  | { readonly accepted: false; readonly reason: string };

function decodeJson(encoded: string): unknown {
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

export function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function isPayable(entry: z.output<typeof acceptsSchema>): boolean {
  return (
    entry.scheme === "exact" &&
    entry.network === xLayerNetwork &&
    sameAddress(entry.asset, usdt0Address)
  );
}

function micros(amount: string): number | null {
  const value = BigInt(amount);
  return value > 0n && value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

export function chooseTerms(paymentRequired: string, maxAmountMicros: number): TermsDecision {
  const decoded = paymentRequiredSchema.safeParse(decodeJson(paymentRequired));
  if (!decoded.success) {
    return { accepted: false, reason: "The seller's PAYMENT-REQUIRED header is not x402 v2" };
  }
  const offers = decoded.data.accepts.map((raw, index) => ({
    index,
    entry: acceptsSchema.safeParse(raw),
  }));
  const payable = offers.flatMap(({ index, entry }) =>
    entry.success && isPayable(entry.data) ? [{ index, entry: entry.data }] : [],
  );
  const offer = payable[0];
  if (offer === undefined) {
    return {
      accepted: false,
      reason: `The seller offers no exact USDT0 payment on ${xLayerNetwork}`,
    };
  }
  const amountMicros = micros(offer.entry.amount);
  if (amountMicros === null) {
    return { accepted: false, reason: `The quoted amount ${offer.entry.amount} is not payable` };
  }
  if (amountMicros > maxAmountMicros) {
    return {
      accepted: false,
      reason: `The quoted price ${formatMicros(amountMicros)} exceeds maxAmount ${formatMicros(maxAmountMicros)}`,
    };
  }
  return {
    accepted: true,
    terms: {
      paymentRequired,
      index: offer.index,
      amountMicros,
      payTo: offer.entry.payTo,
      maxTimeoutSeconds: offer.entry.maxTimeoutSeconds,
    },
  };
}

export function decodeSignedAuthorization(paymentSignature: string): SignedAuthorization | null {
  const decoded = signedPaymentSchema.safeParse(decodeJson(paymentSignature));
  return decoded.success ? decoded.data.payload.authorization : null;
}

export function decodePaymentReceipt(paymentResponse: string): PaymentReceipt | null {
  const decoded = paymentResponseSchema.safeParse(decodeJson(paymentResponse));
  return decoded.success ? decoded.data : null;
}
