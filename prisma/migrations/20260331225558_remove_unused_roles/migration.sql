/*
  Warnings:

  - The values [MANAGER,ACCOUNTANT,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUSPENDED] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `calculationBase` column on the `fee_rules` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `board_positions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BoardRole" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'VOCAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CalculationBase" AS ENUM ('COEFFICIENT', 'QUOTA_PERCENT', 'FIXED');

-- Delete users with roles that will be removed (all test data)
DELETE FROM "users" WHERE "role" IN ('MANAGER', 'ACCOUNTANT', 'VIEWER');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'OFFICE_ADMIN', 'PRESIDENT', 'OWNER', 'PROVIDER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "board_positions" DROP COLUMN "role",
ADD COLUMN     "role" "BoardRole" NOT NULL;

-- AlterTable
ALTER TABLE "fee_rules" DROP COLUMN "calculationBase",
ADD COLUMN     "calculationBase" "CalculationBase" NOT NULL DEFAULT 'FIXED';

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "units_tenantId_idx" ON "units"("tenantId");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
