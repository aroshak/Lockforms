-- Migration: 20260317000000_api_keys_webhooks
-- Adds ApiKey and Webhook tables for LockForms API integration features

-- ── ApiKey ────────────────────────────────────────────────────────────────
CREATE TABLE "ApiKey" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "keyHash"        TEXT NOT NULL,
    "prefix"         TEXT NOT NULL,
    "scopes"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "organizationId" TEXT,
    "createdById"    TEXT,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt"     TIMESTAMP(3),
    "expiresAt"      TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_keyHash_idx"        ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_organizationId_idx" ON "ApiKey"("organizationId");

-- ── Webhook ───────────────────────────────────────────────────────────────
CREATE TABLE "Webhook" (
    "id"              TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "url"             TEXT NOT NULL,
    "events"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "secret"          TEXT NOT NULL,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "organizationId"  TEXT,
    "formId"          TEXT,
    "lastDeliveredAt" TIMESTAMP(3),
    "failureCount"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Webhook_organizationId_idx"          ON "Webhook"("organizationId");
CREATE INDEX "Webhook_isActive_organizationId_idx" ON "Webhook"("isActive", "organizationId");
