ALTER TABLE "peer_instances" ALTER COLUMN "remote_instance_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "peer_instances" ALTER COLUMN "base_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "peer_instances" ALTER COLUMN "public_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "peer_instances" ALTER COLUMN "key_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "federation_invites" ADD COLUMN "peer_id" uuid;--> statement-breakpoint
ALTER TABLE "federation_invites" ADD CONSTRAINT "federation_invites_peer_id_peer_instances_id_fk" FOREIGN KEY ("peer_id") REFERENCES "public"."peer_instances"("id") ON DELETE cascade ON UPDATE no action;