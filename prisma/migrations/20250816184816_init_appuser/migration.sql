/*
  Warnings:

  - You are about to drop the column `name` on the `AppUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."AppUser_clerkId_idx";

-- DropIndex
DROP INDEX "public"."AppUser_email_idx";

-- AlterTable
ALTER TABLE "public"."AppUser" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_username_key" ON "public"."AppUser"("username");
