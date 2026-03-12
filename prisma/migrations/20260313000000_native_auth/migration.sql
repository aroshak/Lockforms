-- Migration: Native Auth (NextAuth + RBAC)
-- Adds: Organization, User, Account, Session, VerificationToken,
--       Role, UserRole, SecurityPolicy
-- Also adds tenant scoping columns to Form and Submission
-- and userId column to AuditLog

-- ============================================================
-- Organization
-- ============================================================
CREATE TABLE "Organization" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- ============================================================
-- User
-- ============================================================
CREATE TABLE "User" (
    "id"                  TEXT NOT NULL,
    "email"               TEXT NOT NULL,
    "passwordHash"        TEXT,
    "name"                TEXT,
    "firstName"           TEXT,
    "lastName"            TEXT,
    "image"               TEXT,
    "emailVerified"       TIMESTAMP(3),
    "isActive"            BOOLEAN NOT NULL DEFAULT true,
    "isSSOUser"           BOOLEAN NOT NULL DEFAULT false,
    "organizationId"      TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailedLoginAt"   TIMESTAMP(3),
    "lockedUntil"         TIMESTAMP(3),
    "lastLoginAt"         TIMESTAMP(3),
    "lastLoginIP"         TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_isActive_idx" ON "User"("email", "isActive");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- NextAuth: Account
-- ============================================================
CREATE TABLE "Account" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "type"              TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
    ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NextAuth: Session
-- ============================================================
CREATE TABLE "Session" (
    "id"           TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NextAuth: VerificationToken
-- ============================================================
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
    ON "VerificationToken"("identifier", "token");

-- ============================================================
-- RBAC: Role
-- ============================================================
CREATE TABLE "Role" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "isSystem"    BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- ============================================================
-- RBAC: UserRole
-- ============================================================
CREATE TABLE "UserRole" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "roleId"     TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Security Policies
-- ============================================================
CREATE TABLE "SecurityPolicy" (
    "id"        TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "value"     JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityPolicy_key_key" ON "SecurityPolicy"("key");
CREATE INDEX "SecurityPolicy_key_idx" ON "SecurityPolicy"("key");

-- ============================================================
-- Add tenant scoping to Form
-- ============================================================
ALTER TABLE "Form" ADD COLUMN "organizationId" VARCHAR(255);
CREATE INDEX "Form_organizationId_idx" ON "Form"("organizationId");

ALTER TABLE "Form" ADD CONSTRAINT "Form_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Add tenant scoping to Submission
-- ============================================================
ALTER TABLE "Submission" ADD COLUMN "organizationId" VARCHAR(255);
CREATE INDEX "Submission_organizationId_idx" ON "Submission"("organizationId");

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Add userId to AuditLog (links audit entries to User)
-- ============================================================
ALTER TABLE "AuditLog" ADD COLUMN "userId" TEXT;
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
