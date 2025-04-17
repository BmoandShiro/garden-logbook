/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Log` table. All the data in the column will be lost.
  - Added the required column `type` to the `LogTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE', 'TIME', 'DATETIME', 'RATING', 'MEASUREMENT', 'TEMPERATURE', 'HUMIDITY', 'COUNTER', 'TIMER', 'MEDIA', 'LOCATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogType" ADD VALUE 'TRANSPLANT';
ALTER TYPE "LogType" ADD VALUE 'GERMINATION';
ALTER TYPE "LogType" ADD VALUE 'CLONING';
ALTER TYPE "LogType" ADD VALUE 'INSPECTION';
ALTER TYPE "LogType" ADD VALUE 'TREATMENT';
ALTER TYPE "LogType" ADD VALUE 'STRESS';

-- DropForeignKey
ALTER TABLE "LogEntry" DROP CONSTRAINT "LogEntry_roomId_fkey";

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "imageUrl",
ADD COLUMN     "actions" TEXT[],
ADD COLUMN     "co2" DOUBLE PRECISION,
ADD COLUMN     "gardenId" TEXT,
ADD COLUMN     "healthRating" INTEGER,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "materials" TEXT[],
ADD COLUMN     "nodeCount" INTEGER,
ADD COLUMN     "nutrientPpm" DOUBLE PRECISION,
ADD COLUMN     "pestFound" TEXT[],
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "runoff" DOUBLE PRECISION,
ADD COLUMN     "symptoms" TEXT[],
ADD COLUMN     "vpd" DOUBLE PRECISION,
ADD COLUMN     "width" DOUBLE PRECISION,
ADD COLUMN     "zoneId" TEXT;

-- AlterTable
ALTER TABLE "LogEntry" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "gardenId" TEXT,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "weather" JSONB,
ADD COLUMN     "zoneId" TEXT,
ALTER COLUMN "roomId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LogTemplate" ADD COLUMN     "color" TEXT,
ADD COLUMN     "defaultValues" JSONB,
ADD COLUMN     "gardenId" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "layout" JSONB,
ADD COLUMN     "reminderBefore" INTEGER,
ADD COLUMN     "reminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "required" TEXT[],
ADD COLUMN     "scheduleConfig" JSONB,
ADD COLUMN     "type" "LogType" NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogTemplate" ADD CONSTRAINT "LogTemplate_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
