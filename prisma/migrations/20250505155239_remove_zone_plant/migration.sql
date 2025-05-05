/*
  Warnings:

  - You are about to drop the column `zonePlantId` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the `ZonePlant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_zonePlantId_fkey";

-- DropForeignKey
ALTER TABLE "ZonePlant" DROP CONSTRAINT "ZonePlant_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "ZonePlant" DROP CONSTRAINT "ZonePlant_zoneId_fkey";

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "zonePlantId";

-- DropTable
DROP TABLE "ZonePlant";
