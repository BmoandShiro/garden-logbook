/*
  Warnings:

  - The values [PRUNING] on the enum `LogType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "LSTIntensity" AS ENUM ('LIGHT', 'MODERATE', 'INTENSE');

-- CreateEnum
CREATE TYPE "CanopyShape" AS ENUM ('EVEN', 'SLOPED', 'SUPER_UNEVEN');

-- AlterEnum
BEGIN;
CREATE TYPE "LogType_new" AS ENUM ('WATERING', 'ENVIRONMENTAL', 'LST', 'FLUSHING', 'HARVEST', 'PEST_DISEASE', 'TRANSPLANT', 'GERMINATION', 'CLONING', 'INSPECTION', 'TREATMENT', 'STRESS', 'GENERAL', 'CUSTOM');
ALTER TABLE "Field" ALTER COLUMN "logType" TYPE "LogType_new" USING ("logType"::text::"LogType_new");
ALTER TABLE "Log" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TABLE "LogTemplate" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TYPE "LogType" RENAME TO "LogType_old";
ALTER TYPE "LogType_new" RENAME TO "LogType";
DROP TYPE "LogType_old";
COMMIT;
