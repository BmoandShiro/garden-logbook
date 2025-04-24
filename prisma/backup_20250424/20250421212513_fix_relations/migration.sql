/*
  Warnings:

  - You are about to drop the column `actionDate` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `actionTime` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `airflow` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `boosterAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `branchCount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `curingDays` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `customData` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `customNutrients` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `deficiencies` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `diseaseSeverity` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `diseaseTypes` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `dryWeight` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `dryWeightUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `dryingDays` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `dryingHumidity` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `dryingTemp` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedYield` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedYieldUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `finishAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `heightUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `jacks321Used` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `leafColor` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `lightHeight` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `lightHeightUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `mediumMoisture` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `mediumPh` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `mediumTemp` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `nutrientLine` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `par` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `partAAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `partBAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `partCAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `pestSeverity` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `pestTypes` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `runoffEc` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `sectionImages` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `sectionNotes` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `temperatureUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `trainingMethods` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentDosage` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentDosageUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentMethods` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentProducts` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `trimAmount` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `trimAmountUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `trimWeight` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `trimWeightUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `waterEc` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `waterSource` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `waterTemperature` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `waterUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `wetWeight` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `wetWeightUnit` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `widthUnit` on the `Log` table. All the data in the column will be lost.
  - Added the required column `logDate` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('NUMBER', 'TEXT', 'BOOLEAN', 'DATE', 'TIME', 'DATETIME', 'ENUM', 'MULTI_ENUM');

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_plantId_fkey";

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "actionDate",
DROP COLUMN "actionTime",
DROP COLUMN "airflow",
DROP COLUMN "boosterAmount",
DROP COLUMN "branchCount",
DROP COLUMN "curingDays",
DROP COLUMN "customData",
DROP COLUMN "customNutrients",
DROP COLUMN "deficiencies",
DROP COLUMN "diseaseSeverity",
DROP COLUMN "diseaseTypes",
DROP COLUMN "dryWeight",
DROP COLUMN "dryWeightUnit",
DROP COLUMN "dryingDays",
DROP COLUMN "dryingHumidity",
DROP COLUMN "dryingTemp",
DROP COLUMN "estimatedYield",
DROP COLUMN "estimatedYieldUnit",
DROP COLUMN "finishAmount",
DROP COLUMN "heightUnit",
DROP COLUMN "jacks321Used",
DROP COLUMN "leafColor",
DROP COLUMN "lightHeight",
DROP COLUMN "lightHeightUnit",
DROP COLUMN "mediumMoisture",
DROP COLUMN "mediumPh",
DROP COLUMN "mediumTemp",
DROP COLUMN "nutrientLine",
DROP COLUMN "par",
DROP COLUMN "partAAmount",
DROP COLUMN "partBAmount",
DROP COLUMN "partCAmount",
DROP COLUMN "pestSeverity",
DROP COLUMN "pestTypes",
DROP COLUMN "runoffEc",
DROP COLUMN "sectionImages",
DROP COLUMN "sectionNotes",
DROP COLUMN "temperatureUnit",
DROP COLUMN "trainingMethods",
DROP COLUMN "treatmentDosage",
DROP COLUMN "treatmentDosageUnit",
DROP COLUMN "treatmentMethods",
DROP COLUMN "treatmentProducts",
DROP COLUMN "trimAmount",
DROP COLUMN "trimAmountUnit",
DROP COLUMN "trimWeight",
DROP COLUMN "trimWeightUnit",
DROP COLUMN "waterEc",
DROP COLUMN "waterSource",
DROP COLUMN "waterTemperature",
DROP COLUMN "waterUnit",
DROP COLUMN "wetWeight",
DROP COLUMN "wetWeightUnit",
DROP COLUMN "widthUnit",
ADD COLUMN     "boosterPpm" DOUBLE PRECISION,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "finishPpm" DOUBLE PRECISION,
ADD COLUMN     "logDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "partAPpm" DOUBLE PRECISION,
ADD COLUMN     "partBPpm" DOUBLE PRECISION,
ADD COLUMN     "partCPpm" DOUBLE PRECISION,
ADD COLUMN     "runoffPpm" DOUBLE PRECISION,
ADD COLUMN     "waterPpm" DOUBLE PRECISION,
ADD COLUMN     "waterTemp" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MeasurementUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conversion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "type" "MeasurementType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "unitId" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logType" "LogType",
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_userId_idx" ON "Log"("userId");

-- CreateIndex
CREATE INDEX "Log_logDate_idx" ON "Log"("logDate");

-- CreateIndex
CREATE INDEX "Log_type_idx" ON "Log"("type");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "MeasurementUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
