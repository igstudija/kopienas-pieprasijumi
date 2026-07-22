CREATE TABLE "admin_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_lookup" varchar(64) NOT NULL,
	"ip_address" varchar(64) NOT NULL,
	"succeeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
CREATE INDEX "admin_login_attempts_pair_created_idx" ON "admin_login_attempts" USING btree ("phone_lookup","ip_address","created_at");--> statement-breakpoint
CREATE INDEX "admin_login_attempts_created_idx" ON "admin_login_attempts" USING btree ("created_at");