ALTER TABLE "instance_settings" ADD COLUMN "singleton_key" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "federation_private_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "whatsapp_business_number" varchar(32);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "whatsapp_app_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "whatsapp_webhook_verify_token_encrypted" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "setup_completed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "instance_settings_singleton_uq" ON "instance_settings" USING btree ("singleton_key");