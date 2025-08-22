/*
  Warnings:

  - Made the column `username` on table `AppUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."AppUser" ALTER COLUMN "username" SET NOT NULL;
