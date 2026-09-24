import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  agentStatuses,
  authorizationStates,
  currencies,
  denialReasons,
  jobStatuses,
  spendDecisions,
} from "@reins/core";

export const currency = pgEnum("currency", currencies);
export const jobStatus = pgEnum("job_status", jobStatuses);
export const agentStatus = pgEnum("agent_status", agentStatuses);
export const authorizationState = pgEnum("authorization_state", authorizationStates);
export const spendDecision = pgEnum("spend_decision", spendDecisions);
export const denialReason = pgEnum("denial_reason", denialReasons);

const micros = (name: string) => bigint(name, { mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    customer: text("customer").notNull(),
    revenueMicros: micros("revenue_micros"),
    maxBudgetMicros: micros("max_budget_micros").notNull(),
    maxPerPurchaseMicros: micros("max_per_purchase_micros").notNull(),
    currency: currency("currency").notNull(),
    allowedServices: text("allowed_services").array().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    delegationAllowed: boolean("delegation_allowed").notNull(),
    status: jobStatus("status").notNull().default("ACTIVE"),
    settledMicros: micros("settled_micros").notNull().default(0),
    committedMicros: micros("committed_micros").notNull().default(0),
    isDemoData: boolean("is_demo_data").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "jobs_budget_invariant",
      sql`${table.settledMicros} + ${table.committedMicros} <= ${table.maxBudgetMicros}`,
    ),
    check(
      "jobs_non_negative",
      sql`${table.settledMicros} >= 0 and ${table.committedMicros} >= 0 and ${table.maxPerPurchaseMicros} > 0`,
    ),
  ],
);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    name: text("name").notNull(),
    role: text("role").notNull(),
    parentAgentId: uuid("parent_agent_id").references((): AnyPgColumn => agents.id),
    replacesAgentId: uuid("replaces_agent_id").references((): AnyPgColumn => agents.id),
    status: agentStatus("status").notNull().default("ACTIVE"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [index("agents_job_idx").on(table.jobId)],
);

export const authorizations = pgTable(
  "authorizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id),
    operationId: text("operation_id").notNull(),
    service: text("service").notNull(),
    amountMicros: micros("amount_micros").notNull(),
    state: authorizationState("state").notNull().default("RESERVED"),
    txHash: text("tx_hash"),
    network: text("network"),
    deliverable: text("deliverable"),
    resolutionReason: text("resolution_reason"),
    paymentUrl: text("payment_url"),
    payer: text("payer"),
    payTo: text("pay_to"),
    paymentNonce: text("payment_nonce"),
    validBefore: timestamp("valid_before", { withTimezone: true }),
    paymentBlock: bigint("payment_block", { mode: "number" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("authorizations_job_operation_unique").on(table.jobId, table.operationId),
    index("authorizations_job_idx").on(table.jobId),
  ],
);

export const spendRequests = pgTable(
  "spend_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    agentId: uuid("agent_id").references(() => agents.id),
    operationId: text("operation_id").notNull(),
    service: text("service").notNull(),
    amountMicros: micros("amount_micros").notNull(),
    decision: spendDecision("decision").notNull(),
    denialReason: denialReason("denial_reason"),
    availableMicros: micros("available_micros").notNull(),
    authorizationId: uuid("authorization_id").references(() => authorizations.id),
    createdAt: createdAt(),
  },
  (table) => [index("spend_requests_job_idx").on(table.jobId, table.createdAt)],
);
