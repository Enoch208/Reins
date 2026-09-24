import {
  parseMicros,
  type AttachAgentBody,
  type CreateJobBody,
  type DelegateBody,
  type MarkUnresolvedBody,
  type PurchaseRequestBody,
  type ReconcileBody,
  type ReleaseBody,
  type ReplaceBody,
  type RevokeBody,
  type SettleBody,
  type SpendRequestBody,
} from "@reins/core";
import { z } from "zod";

const text = z.string().trim().min(1).max(200);
const uuid = z.uuid();

function micros(minimum: number) {
  return z.string().transform((value, ctx) => {
    const parsed = parseMicros(value);
    if (parsed === null || parsed < minimum) {
      ctx.issues.push({
        code: "custom",
        input: value,
        message: `Expected a decimal amount of at least ${String(minimum)} micro-USDT with at most 6 decimals`,
      });
      return z.NEVER;
    }
    return parsed;
  });
}

export const createJobSchema = z.strictObject({
  title: text,
  customer: text,
  revenue: micros(0).nullable(),
  maxBudget: micros(1),
  maxPerPurchase: micros(1),
  allowedServices: z.array(text).min(1),
  expiresAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  delegationAllowed: z.boolean(),
  isDemoData: z.boolean(),
}) satisfies z.ZodType<unknown, CreateJobBody>;

export const attachAgentSchema = z.strictObject({
  name: text,
  role: text,
}) satisfies z.ZodType<unknown, AttachAgentBody>;

export const delegateSchema = z.strictObject({
  parentAgentId: uuid,
  name: text,
  role: text,
}) satisfies z.ZodType<unknown, DelegateBody>;

export const replaceSchema = z.strictObject({
  agentId: uuid,
  name: text,
}) satisfies z.ZodType<unknown, ReplaceBody>;

export const revokeSchema = z.strictObject({
  agentId: uuid.nullable(),
}) satisfies z.ZodType<unknown, RevokeBody>;

export const spendSchema = z.strictObject({
  agentId: text,
  service: text,
  amount: micros(1),
  operationId: text,
}) satisfies z.ZodType<unknown, SpendRequestBody>;

export const settleSchema = z.strictObject({
  txHash: text,
  network: text,
  deliverable: z.string().trim().min(1).max(2000).nullable(),
}) satisfies z.ZodType<unknown, SettleBody>;

export const releaseSchema = z.strictObject({
  reason: text,
}) satisfies z.ZodType<unknown, ReleaseBody>;

export const markUnresolvedSchema = z.strictObject({
  reason: text,
}) satisfies z.ZodType<unknown, MarkUnresolvedBody>;

export const reconcileSchema = z
  .strictObject({
    outcome: z.enum(["SETTLED", "RELEASED"]),
    txHash: text.nullable(),
    network: text.nullable(),
  })
  .refine(
    (body) => body.outcome === "RELEASED" || (body.txHash !== null && body.network !== null),
    {
      message: "A SETTLED reconciliation needs txHash and network",
    },
  ) satisfies z.ZodType<unknown, ReconcileBody>;

export const purchaseSchema = z.strictObject({
  agentId: text,
  service: text,
  operationId: text,
  url: z.url({ protocol: /^https?$/ }).max(2000),
  maxAmount: micros(1),
}) satisfies z.ZodType<unknown, PurchaseRequestBody>;

export type CreateJobInput = z.output<typeof createJobSchema>;
export type SpendInput = z.output<typeof spendSchema>;
export type SettleInput = z.output<typeof settleSchema>;
export type ReconcileInput = z.output<typeof reconcileSchema>;
export type ReasonInput = z.output<typeof releaseSchema>;
export type PurchaseInput = z.output<typeof purchaseSchema>;
