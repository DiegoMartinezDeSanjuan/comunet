-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT', 'PRESIDENT', 'OWNER', 'PROVIDER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('APARTMENT', 'COMMERCIAL', 'GARAGE', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'DIRECT_DEBIT', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('PUBLIC', 'INTERNAL');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ORDINARY', 'EXTRAORDINARY');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'HELD', 'CLOSED');

-- CreateEnum
CREATE TYPE "MinuteStatus" AS ENUM ('DRAFT', 'GENERATED', 'APPROVED');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('IN_PERSON', 'DELEGATED', 'REMOTE');

-- CreateEnum
CREATE TYPE "VoteValue" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'OWNERS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "offices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "linkedOwnerId" TEXT,
    "linkedProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "address" TEXT,
    "iban" TEXT,
    "fiscalYear" INTEGER NOT NULL DEFAULT 2024,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "buildingId" TEXT,
    "reference" TEXT NOT NULL,
    "type" "UnitType" NOT NULL DEFAULT 'APARTMENT',
    "floor" TEXT,
    "door" TEXT,
    "areaM2" DECIMAL(10,2),
    "coefficient" DECIMAL(10,6) NOT NULL DEFAULT 1.0,
    "quotaPercent" DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dni" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dni" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownerships" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownershipPercent" DECIMAL(10,4) NOT NULL DEFAULT 100,
    "isPrimaryBillingContact" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_positions" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "board_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "category" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "periodicity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_rules" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "FeeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationBase" TEXT,
    "fixedAmount" DECIMAL(12,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "receiptId" TEXT,
    "principal" DECIMAL(12,2) NOT NULL,
    "surcharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "DebtStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "unitId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "IncidentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_comments" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "CommentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL DEFAULT 'ORDINARY',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "ownerId" TEXT,
    "unitId" TEXT,
    "attendeeName" TEXT NOT NULL,
    "coefficientPresent" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "attendanceType" "AttendanceType" NOT NULL DEFAULT 'IN_PERSON',

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "ownerId" TEXT,
    "unitId" TEXT,
    "vote" "VoteValue" NOT NULL DEFAULT 'ABSTAIN',
    "coefficientWeight" DECIMAL(10,6) NOT NULL DEFAULT 0,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minutes" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "content" TEXT,
    "status" "MinuteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "communityId" TEXT,
    "recipientUserId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offices_slug_key" ON "offices"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_officeId_idx" ON "users"("officeId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "communities_officeId_idx" ON "communities"("officeId");

-- CreateIndex
CREATE INDEX "buildings_communityId_idx" ON "buildings"("communityId");

-- CreateIndex
CREATE INDEX "units_communityId_idx" ON "units"("communityId");

-- CreateIndex
CREATE INDEX "units_buildingId_idx" ON "units"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "units_communityId_reference_key" ON "units"("communityId", "reference");

-- CreateIndex
CREATE INDEX "owners_officeId_idx" ON "owners"("officeId");

-- CreateIndex
CREATE INDEX "tenants_officeId_idx" ON "tenants"("officeId");

-- CreateIndex
CREATE INDEX "ownerships_unitId_idx" ON "ownerships"("unitId");

-- CreateIndex
CREATE INDEX "ownerships_ownerId_idx" ON "ownerships"("ownerId");

-- CreateIndex
CREATE INDEX "board_positions_communityId_idx" ON "board_positions"("communityId");

-- CreateIndex
CREATE INDEX "board_positions_ownerId_idx" ON "board_positions"("ownerId");

-- CreateIndex
CREATE INDEX "providers_officeId_idx" ON "providers"("officeId");

-- CreateIndex
CREATE INDEX "budgets_communityId_idx" ON "budgets"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_communityId_year_key" ON "budgets"("communityId", "year");

-- CreateIndex
CREATE INDEX "budget_lines_budgetId_idx" ON "budget_lines"("budgetId");

-- CreateIndex
CREATE INDEX "fee_rules_communityId_idx" ON "fee_rules"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_reference_key" ON "receipts"("reference");

-- CreateIndex
CREATE INDEX "receipts_communityId_idx" ON "receipts"("communityId");

-- CreateIndex
CREATE INDEX "receipts_unitId_idx" ON "receipts"("unitId");

-- CreateIndex
CREATE INDEX "receipts_ownerId_idx" ON "receipts"("ownerId");

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "receipts_dueDate_idx" ON "receipts"("dueDate");

-- CreateIndex
CREATE INDEX "payments_receiptId_idx" ON "payments"("receiptId");

-- CreateIndex
CREATE INDEX "debts_communityId_idx" ON "debts"("communityId");

-- CreateIndex
CREATE INDEX "debts_ownerId_idx" ON "debts"("ownerId");

-- CreateIndex
CREATE INDEX "debts_status_idx" ON "debts"("status");

-- CreateIndex
CREATE INDEX "incidents_communityId_idx" ON "incidents"("communityId");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_assignedProviderId_idx" ON "incidents"("assignedProviderId");

-- CreateIndex
CREATE INDEX "incidents_createdByUserId_idx" ON "incidents"("createdByUserId");

-- CreateIndex
CREATE INDEX "incident_comments_incidentId_idx" ON "incident_comments"("incidentId");

-- CreateIndex
CREATE INDEX "meetings_communityId_idx" ON "meetings"("communityId");

-- CreateIndex
CREATE INDEX "meetings_scheduledAt_idx" ON "meetings"("scheduledAt");

-- CreateIndex
CREATE INDEX "agenda_items_meetingId_idx" ON "agenda_items"("meetingId");

-- CreateIndex
CREATE INDEX "attendances_meetingId_idx" ON "attendances"("meetingId");

-- CreateIndex
CREATE INDEX "votes_agendaItemId_idx" ON "votes"("agendaItemId");

-- CreateIndex
CREATE INDEX "minutes_meetingId_idx" ON "minutes"("meetingId");

-- CreateIndex
CREATE INDEX "documents_communityId_idx" ON "documents"("communityId");

-- CreateIndex
CREATE INDEX "documents_visibility_idx" ON "documents"("visibility");

-- CreateIndex
CREATE INDEX "notifications_officeId_idx" ON "notifications"("officeId");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_idx" ON "notifications"("recipientUserId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "audit_logs_officeId_idx" ON "audit_logs"("officeId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_linkedOwnerId_fkey" FOREIGN KEY ("linkedOwnerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_linkedProviderId_fkey" FOREIGN KEY ("linkedProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_positions" ADD CONSTRAINT "board_positions_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_positions" ADD CONSTRAINT "board_positions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minutes" ADD CONSTRAINT "minutes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
