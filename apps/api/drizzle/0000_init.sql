CREATE TYPE "public"."agent_status" AS ENUM('ACTIVE', 'REPLACED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."authorization_state" AS ENUM('RESERVED', 'SETTLED', 'RELEASED', 'UNRESOLVED');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USDT');--> statement-breakpoint
CREATE TYPE "public"."denial_reason" AS ENUM('JOB_NOT_ACTIVE', 'JOB_EXPIRED', 'SERVICE_NOT_ALLOWED', 'PER_PURCHASE_LIMIT_EXCEEDED', 'AGENT_NOT_IN_JOB', 'AGENT_REVOKED', 'JOB_BUDGET_EXCEEDED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('ACTIVE', 'REVOKED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."spend_decision" AS ENUM('APPROVED', 'DENIED');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"parent_agent_id" uuid,
	"replaces_agent_id" uuid,
	"status" "agent_status" DEFAULT 'ACTIVE' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"operation_id" text NOT NULL,
	"service" text NOT NULL,
	"amount_micros" bigint NOT NULL,
	"state" "authorization_state" DEFAULT 'RESERVED' NOT NULL,
	"tx_hash" text,
	"network" text,
	"deliverable" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"customer" text NOT NULL,
	"revenue_micros" bigint,
	"max_budget_micros" bigint NOT NULL,
	"max_per_purchase_micros" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"allowed_services" text[] NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"delegation_allowed" boolean NOT NULL,
	"status" "job_status" DEFAULT 'ACTIVE' NOT NULL,
	"settled_micros" bigint DEFAULT 0 NOT NULL,
	"committed_micros" bigint DEFAULT 0 NOT NULL,
	"is_demo_data" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_budget_invariant" CHECK ("jobs"."settled_micros" + "jobs"."committed_micros" <= "jobs"."max_budget_micros"),
	CONSTRAINT "jobs_non_negative" CHECK ("jobs"."settled_micros" >= 0 and "jobs"."committed_micros" >= 0 and "jobs"."max_per_purchase_micros" > 0)
);
--> statement-breakpoint
CREATE TABLE "spend_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"agent_id" uuid,
	"operation_id" text NOT NULL,
	"service" text NOT NULL,
	"amount_micros" bigint NOT NULL,
	"decision" "spend_decision" NOT NULL,
	"denial_reason" "denial_reason",
	"available_micros" bigint NOT NULL,
	"authorization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_parent_agent_id_agents_id_fk" FOREIGN KEY ("parent_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_replaces_agent_id_agents_id_fk" FOREIGN KEY ("replaces_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_requests" ADD CONSTRAINT "spend_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_requests" ADD CONSTRAINT "spend_requests_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_requests" ADD CONSTRAINT "spend_requests_authorization_id_authorizations_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "public"."authorizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_job_idx" ON "agents" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "authorizations_job_operation_unique" ON "authorizations" USING btree ("job_id","operation_id");--> statement-breakpoint
CREATE INDEX "authorizations_job_idx" ON "authorizations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "spend_requests_job_idx" ON "spend_requests" USING btree ("job_id","created_at");