-- CreateEnum
CREATE TYPE "public"."scopeItemStatus" AS ENUM ('PENDING', 'COMPLETED', 'IN_PROGRESS');

-- AlterTable
ALTER TABLE "public"."Request" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."ScopeItem" ADD COLUMN     "status" "public"."scopeItemStatus" NOT NULL DEFAULT 'PENDING';
