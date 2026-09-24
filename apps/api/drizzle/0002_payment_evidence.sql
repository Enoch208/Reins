ALTER TABLE "authorizations" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "authorizations" ADD COLUMN "payer" text;--> statement-breakpoint
ALTER TABLE "authorizations" ADD COLUMN "pay_to" text;--> statement-breakpoint
ALTER TABLE "authorizations" ADD COLUMN "payment_nonce" text;--> statement-breakpoint
ALTER TABLE "authorizations" ADD COLUMN "valid_before" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "authorizations" ADD COLUMN "payment_block" bigint;