CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'processing', 'delivered', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."peer_status" AS ENUM('pending', 'active', 'paused', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('active', 'fulfilled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."request_visibility" AS ENUM('local', 'selected_peers', 'all_peers');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'suspended', 'archived');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(120) NOT NULL,
	"object_type" varchar(80) NOT NULL,
	"object_id" varchar(160),
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(64),
	"request_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federation_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"peer_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federation_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret_digest" varchar(64) NOT NULL,
	"label" varchar(160),
	"created_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federation_nonces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peer_id" uuid NOT NULL,
	"nonce" varchar(160) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federation_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"peer_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"base_url" text NOT NULL,
	"timezone" varchar(80) DEFAULT 'Europe/Riga' NOT NULL,
	"locale" varchar(12) DEFAULT 'lv' NOT NULL,
	"federation_public_key" text,
	"federation_key_id" varchar(100),
	"federation_protocol" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remote_instance_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"base_url" text NOT NULL,
	"public_key" text NOT NULL,
	"key_id" varchar(100) NOT NULL,
	"protocol_version" integer DEFAULT 1 NOT NULL,
	"status" "peer_status" DEFAULT 'pending' NOT NULL,
	"allow_incoming" boolean DEFAULT true NOT NULL,
	"allow_outgoing" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_instance_id" uuid NOT NULL,
	"origin_request_id" uuid NOT NULL,
	"peer_id" uuid NOT NULL,
	"author_display_name" varchar(160) NOT NULL,
	"author_company" varchar(180) NOT NULL,
	"author_category" varchar(180),
	"title" varchar(180) NOT NULL,
	"details" text NOT NULL,
	"target" varchar(240),
	"industry" varchar(160),
	"region" varchar(160),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "request_status" DEFAULT 'active' NOT NULL,
	"revision" integer NOT NULL,
	"origin_created_at" timestamp with time zone NOT NULL,
	"origin_updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_peer_visibility" (
	"request_id" uuid NOT NULL,
	"peer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_digest" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specific_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_instance_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"details" text NOT NULL,
	"target" varchar(240),
	"industry" varchar(160),
	"region" varchar(160),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "request_status" DEFAULT 'active' NOT NULL,
	"visibility" "request_visibility" DEFAULT 'local' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"company" varchar(180) NOT NULL,
	"category" varchar(180),
	"email" varchar(320),
	"phone_encrypted" text NOT NULL,
	"phone_lookup" varchar(64) NOT NULL,
	"phone_last4" varchar(4) NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"status" "user_status" DEFAULT 'invited' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_login_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_token_digest" varchar(64) NOT NULL,
	"browser_token_digest" varchar(64) NOT NULL,
	"user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"requested_ip" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_inbox" ADD CONSTRAINT "federation_inbox_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_invites" ADD CONSTRAINT "federation_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_nonces" ADD CONSTRAINT "federation_nonces_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_outbox" ADD CONSTRAINT "federation_outbox_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_requests" ADD CONSTRAINT "remote_requests_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_peer_visibility" ADD CONSTRAINT "request_peer_visibility_request_id_specific_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."specific_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_peer_visibility" ADD CONSTRAINT "request_peer_visibility_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specific_requests" ADD CONSTRAINT "specific_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_login_challenges" ADD CONSTRAINT "whatsapp_login_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "federation_inbox_event_peer_uq" ON "federation_inbox" USING btree ("event_id","peer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "federation_invites_secret_uq" ON "federation_invites" USING btree ("secret_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "federation_nonces_peer_nonce_uq" ON "federation_nonces" USING btree ("peer_id","nonce");--> statement-breakpoint
CREATE UNIQUE INDEX "federation_outbox_event_peer_uq" ON "federation_outbox" USING btree ("event_id","peer_id");--> statement-breakpoint
CREATE INDEX "federation_outbox_pending_idx" ON "federation_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "peer_instances_remote_id_uq" ON "peer_instances" USING btree ("remote_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "remote_requests_origin_uq" ON "remote_requests" USING btree ("origin_instance_id","origin_request_id");--> statement-breakpoint
CREATE INDEX "remote_requests_active_updated_idx" ON "remote_requests" USING btree ("status","origin_updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "request_peer_visibility_uq" ON "request_peer_visibility" USING btree ("request_id","peer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_digest_uq" ON "sessions" USING btree ("token_digest");--> statement-breakpoint
CREATE INDEX "sessions_user_active_idx" ON "sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "specific_requests_active_updated_idx" ON "specific_requests" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "specific_requests_author_updated_idx" ON "specific_requests" USING btree ("author_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_lookup_uq" ON "users" USING btree ("phone_lookup");--> statement-breakpoint
CREATE INDEX "users_status_role_idx" ON "users" USING btree ("status","role");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_login_message_token_uq" ON "whatsapp_login_challenges" USING btree ("message_token_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_login_browser_token_uq" ON "whatsapp_login_challenges" USING btree ("browser_token_digest");--> statement-breakpoint
CREATE INDEX "whatsapp_login_expiry_idx" ON "whatsapp_login_challenges" USING btree ("expires_at");