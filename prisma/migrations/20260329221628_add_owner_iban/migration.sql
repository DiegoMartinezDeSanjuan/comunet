/*
  Warnings:

  - You are about to alter the column `coefficientPresent` on the `attendances` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.
  - You are about to alter the column `amount` on the `budget_lines` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `totalAmount` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `principal` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `surcharge` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `fixedAmount` on the `fee_rules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `ownershipPercent` on the `ownerships` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `DoublePrecision`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `amount` on the `receipts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `paidAmount` on the `receipts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `areaM2` on the `units` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `coefficient` on the `units` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.
  - You are about to alter the column `quotaPercent` on the `units` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.
  - You are about to alter the column `coefficientWeight` on the `votes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "coefficientPresent" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "budget_lines" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "debts" ALTER COLUMN "principal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "surcharge" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "fee_rules" ALTER COLUMN "fixedAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "owners" ADD COLUMN     "iban" TEXT;

-- AlterTable
ALTER TABLE "ownerships" ALTER COLUMN "ownershipPercent" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "receipts" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "paidAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "areaM2" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "coefficient" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "quotaPercent" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "votes" ALTER COLUMN "coefficientWeight" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "debts_communityId_status_idx" ON "debts"("communityId", "status");

-- CreateIndex
CREATE INDEX "debts_ownerId_status_idx" ON "debts"("ownerId", "status");

-- CreateIndex
CREATE INDEX "ownerships_ownerId_endDate_idx" ON "ownerships"("ownerId", "endDate");

-- CreateIndex
CREATE INDEX "receipts_ownerId_communityId_idx" ON "receipts"("ownerId", "communityId");
