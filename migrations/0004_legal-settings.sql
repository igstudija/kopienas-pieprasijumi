ALTER TABLE "instance_settings" ADD COLUMN "legal_entity_name" varchar(200);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "legal_registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "legal_address" text;--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "legal_country" varchar(100);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "legal_email" varchar(320);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "legal_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "privacy_contact_email" varchar(320);--> statement-breakpoint
ALTER TABLE "instance_settings" ADD COLUMN "data_retention_months" integer DEFAULT 24 NOT NULL;