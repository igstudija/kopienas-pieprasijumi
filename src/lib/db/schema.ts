import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "admin", "member"]);
export const userStatus = pgEnum("user_status", ["invited", "active", "suspended", "archived"]);
export const requestStatus = pgEnum("request_status", ["active", "fulfilled", "archived"]);
export const requestVisibility = pgEnum("request_visibility", ["local", "selected_peers", "all_peers"]);
export const peerStatus = pgEnum("peer_status", ["pending", "active", "paused", "revoked"]);
export const deliveryStatus = pgEnum("delivery_status", ["pending", "processing", "delivered", "failed", "dead"]);

export const instanceSettings = pgTable("instance_settings", {
  id: uuid("id").primaryKey(),
  singletonKey: boolean("singleton_key").notNull().default(true),
  name: varchar("name", { length: 160 }).notNull(),
  baseUrl: text("base_url").notNull(),
  timezone: varchar("timezone", { length: 80 }).notNull().default("Europe/Riga"),
  locale: varchar("locale", { length: 12 }).notNull().default("lv"),
  federationPublicKey: text("federation_public_key"),
  federationPrivateKeyEncrypted: text("federation_private_key_encrypted"),
  federationKeyId: varchar("federation_key_id", { length: 100 }),
  federationProtocol: integer("federation_protocol").notNull().default(1),
  whatsappBusinessNumber: varchar("whatsapp_business_number", { length: 32 }),
  whatsappAppSecretEncrypted: text("whatsapp_app_secret_encrypted"),
  whatsappWebhookVerifyTokenEncrypted: text("whatsapp_webhook_verify_token_encrypted"),
  setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("instance_settings_singleton_uq").on(table.singletonKey)]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    company: varchar("company", { length: 180 }).notNull(),
    category: varchar("category", { length: 180 }),
    email: varchar("email", { length: 320 }),
    phoneEncrypted: text("phone_encrypted").notNull(),
    phoneLookup: varchar("phone_lookup", { length: 64 }).notNull(),
    phoneLast4: varchar("phone_last4", { length: 4 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRole("role").notNull().default("member"),
    status: userStatus("status").notNull().default("invited"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_phone_lookup_uq").on(table.phoneLookup), index("users_status_role_idx").on(table.status, table.role)],
);

export const whatsappLoginChallenges = pgTable(
  "whatsapp_login_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageTokenDigest: varchar("message_token_digest", { length: 64 }).notNull(),
    browserTokenDigest: varchar("browser_token_digest", { length: 64 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    requestedIp: varchar("requested_ip", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("whatsapp_login_message_token_uq").on(table.messageTokenDigest),
    uniqueIndex("whatsapp_login_browser_token_uq").on(table.browserTokenDigest),
    index("whatsapp_login_expiry_idx").on(table.expiresAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenDigest: varchar("token_digest", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_digest_uq").on(table.tokenDigest), index("sessions_user_active_idx").on(table.userId, table.expiresAt)],
);

export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phoneLookup: varchar("phone_lookup", { length: 64 }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }).notNull(),
    succeeded: boolean("succeeded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("admin_login_attempts_pair_created_idx").on(table.phoneLookup, table.ipAddress, table.createdAt),
    index("admin_login_attempts_created_idx").on(table.createdAt),
  ],
);

export const specificRequests = pgTable(
  "specific_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeInstanceId: uuid("home_instance_id").notNull(),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 180 }).notNull(),
    details: text("details").notNull(),
    target: varchar("target", { length: 240 }),
    industry: varchar("industry", { length: 160 }),
    region: varchar("region", { length: 160 }),
    tags: text("tags").array().notNull().default([]),
    status: requestStatus("status").notNull().default("active"),
    visibility: requestVisibility("visibility").notNull().default("local"),
    revision: integer("revision").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("specific_requests_active_updated_idx").on(table.status, table.updatedAt),
    index("specific_requests_author_updated_idx").on(table.authorId, table.updatedAt),
  ],
);

export const peerInstances = pgTable(
  "peer_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    remoteInstanceId: uuid("remote_instance_id").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    baseUrl: text("base_url").notNull(),
    publicKey: text("public_key").notNull(),
    keyId: varchar("key_id", { length: 100 }).notNull(),
    protocolVersion: integer("protocol_version").notNull().default(1),
    status: peerStatus("status").notNull().default("pending"),
    allowIncoming: boolean("allow_incoming").notNull().default(true),
    allowOutgoing: boolean("allow_outgoing").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("peer_instances_remote_id_uq").on(table.remoteInstanceId)],
);

export const requestPeerVisibility = pgTable(
  "request_peer_visibility",
  {
    requestId: uuid("request_id").notNull().references(() => specificRequests.id, { onDelete: "cascade" }),
    peerId: uuid("peer_id").notNull().references(() => peerInstances.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("request_peer_visibility_uq").on(table.requestId, table.peerId)],
);

export const federationInvites = pgTable(
  "federation_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    secretDigest: varchar("secret_digest", { length: 64 }).notNull(),
    label: varchar("label", { length: 160 }),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("federation_invites_secret_uq").on(table.secretDigest)],
);

export const federationNonces = pgTable(
  "federation_nonces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    peerId: uuid("peer_id").notNull().references(() => peerInstances.id, { onDelete: "cascade" }),
    nonce: varchar("nonce", { length: 160 }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("federation_nonces_peer_nonce_uq").on(table.peerId, table.nonce)],
);

export const federationOutbox = pgTable(
  "federation_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().defaultRandom(),
    peerId: uuid("peer_id").notNull().references(() => peerInstances.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    revision: integer("revision").notNull(),
    payload: jsonb("payload").notNull(),
    status: deliveryStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("federation_outbox_event_peer_uq").on(table.eventId, table.peerId), index("federation_outbox_pending_idx").on(table.status, table.nextAttemptAt)],
);

export const federationInbox = pgTable(
  "federation_inbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull(),
    peerId: uuid("peer_id").notNull().references(() => peerInstances.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("federation_inbox_event_peer_uq").on(table.eventId, table.peerId)],
);

export const remoteRequests = pgTable(
  "remote_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    originInstanceId: uuid("origin_instance_id").notNull(),
    originRequestId: uuid("origin_request_id").notNull(),
    peerId: uuid("peer_id").notNull().references(() => peerInstances.id, { onDelete: "cascade" }),
    authorDisplayName: varchar("author_display_name", { length: 160 }).notNull(),
    authorCompany: varchar("author_company", { length: 180 }).notNull(),
    authorCategory: varchar("author_category", { length: 180 }),
    title: varchar("title", { length: 180 }).notNull(),
    details: text("details").notNull(),
    target: varchar("target", { length: 240 }),
    industry: varchar("industry", { length: 160 }),
    region: varchar("region", { length: 160 }),
    tags: text("tags").array().notNull().default([]),
    status: requestStatus("status").notNull().default("active"),
    revision: integer("revision").notNull(),
    originCreatedAt: timestamp("origin_created_at", { withTimezone: true }).notNull(),
    originUpdatedAt: timestamp("origin_updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("remote_requests_origin_uq").on(table.originInstanceId, table.originRequestId), index("remote_requests_active_updated_idx").on(table.status, table.originUpdatedAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    objectType: varchar("object_type", { length: 80 }).notNull(),
    objectId: varchar("object_id", { length: 160 }),
    details: jsonb("details").notNull().default({}),
    ipAddress: varchar("ip_address", { length: 64 }),
    requestId: varchar("request_id", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_log_created_idx").on(table.createdAt), index("audit_log_actor_idx").on(table.actorUserId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type SpecificRequest = typeof specificRequests.$inferSelect;
export type RemoteRequest = typeof remoteRequests.$inferSelect;
export type PeerInstance = typeof peerInstances.$inferSelect;
