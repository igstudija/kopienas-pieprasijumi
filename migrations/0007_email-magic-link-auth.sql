CREATE TABLE "email_login_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_digest" varchar(64) NOT NULL,
	"email_digest" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"requested_ip" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_login_attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "whatsapp_login_challenges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_login_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "whatsapp_login_challenges" CASCADE;--> statement-breakpoint
UPDATE "users"
SET "email" = lower(btrim("email"))
WHERE "email" IS NOT NULL;--> statement-breakpoint
UPDATE "users"
SET "email" = 'migration-' || replace("id"::text, '-', '') || '@migration.invalid'
WHERE "email" IS NULL
   OR "email" = ''
   OR "email" !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';--> statement-breakpoint
WITH "ranked_emails" AS (
	SELECT
		"id",
		row_number() OVER (PARTITION BY "email" ORDER BY "created_at", "id") AS "duplicate_rank"
	FROM "users"
)
UPDATE "users"
SET "email" = 'migration-' || replace("users"."id"::text, '-', '') || '@migration.invalid'
FROM "ranked_emails"
WHERE "users"."id" = "ranked_emails"."id"
  AND "ranked_emails"."duplicate_rank" > 1;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "email_provider" varchar(32);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "smtp_host" varchar(255);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "smtp_port" integer;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "smtp_secure" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "smtp_username_encrypted" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "smtp_password_encrypted" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "email_from_address" varchar(320);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "email_from_name" varchar(160);--> statement-breakpoint
ALTER TABLE "email_login_challenges" ADD CONSTRAINT "email_login_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_login_token_uq" ON "email_login_challenges" USING btree ("token_digest");--> statement-breakpoint
CREATE INDEX "email_login_email_created_idx" ON "email_login_challenges" USING btree ("email_digest","created_at");--> statement-breakpoint
CREATE INDEX "email_login_ip_created_idx" ON "email_login_challenges" USING btree ("requested_ip","created_at");--> statement-breakpoint
CREATE INDEX "email_login_expiry_idx" ON "email_login_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "instance_settings" DROP COLUMN "whatsapp_business_number";--> statement-breakpoint
ALTER TABLE "instance_settings" DROP COLUMN "whatsapp_app_secret_encrypted";--> statement-breakpoint
ALTER TABLE "instance_settings" DROP COLUMN "whatsapp_webhook_verify_token_encrypted";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";
