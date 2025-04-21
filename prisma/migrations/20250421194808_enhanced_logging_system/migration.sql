/*
  Warnings:

  - The values [FEEDING,TRAINING,DEFOLIATION] on the enum `LogType` will be removed. If these variants are still used in the database, this will fail.
  - The values [HARVEST] on the enum `Stage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `actions` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `ec` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `materials` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `nutrientPpm` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `nutrients` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `pH` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `pestFound` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `runoff` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `symptoms` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `expectedHarvestDate` on the `ZonePlant` table. All the data in the column will be lost.
  - You are about to drop the column `plantedDate` on the `ZonePlant` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `ZonePlant` table. All the data in the column will be lost.
  - You are about to drop the column `variety` on the `ZonePlant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NutrientLine" AS ENUM ('JACKS_321', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Jacks321Product" AS ENUM ('PART_A_5_12_26', 'PART_B_15_0_0_CALCIUM_NITRATE', 'PART_C_EPSOM_SALT', 'BOOSTER', 'FINISH');

-- CreateEnum
CREATE TYPE "WaterSource" AS ENUM ('TAP', 'RO', 'WELL', 'FILTERED', 'COLLECTED', 'OTHER');

-- CreateEnum
CREATE TYPE "PestType" AS ENUM ('SPIDER_MITES', 'THRIPS', 'APHIDS', 'FUNGUS_GNATS', 'WHITEFLIES', 'ROOT_APHIDS', 'OTHER');

-- CreateEnum
CREATE TYPE "DiseaseType" AS ENUM ('POWDERY_MILDEW', 'BOTRYTIS', 'ROOT_ROT', 'LEAF_SEPTORIA', 'FUSARIUM_WILT', 'OTHER');

-- CreateEnum
CREATE TYPE "TreatmentMethod" AS ENUM ('FOLIAR_SPRAY', 'SOIL_DRENCH', 'BENEFICIAL_INSECTS', 'ENVIRONMENTAL_ADJUSTMENT', 'MANUAL_REMOVAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingMethod" AS ENUM ('TOP', 'FIM', 'LST', 'SCROG', 'SUPER_CROP', 'LOLLIPOP', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "LogType_new" AS ENUM ('WATERING', 'ENVIRONMENTAL', 'PRUNING', 'FLUSHING', 'HARVEST', 'PEST_DISEASE', 'TRANSPLANT', 'GERMINATION', 'CLONING', 'INSPECTION', 'TREATMENT', 'STRESS', 'GENERAL', 'CUSTOM');
ALTER TABLE "Log" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TABLE "LogTemplate" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TYPE "LogType" RENAME TO "LogType_old";
ALTER TYPE "LogType_new" RENAME TO "LogType";
DROP TYPE "LogType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Stage_new" AS ENUM ('SEEDLING', 'VEGETATIVE', 'FLOWERING', 'MOTHER', 'CLONE', 'DRYING', 'CURING');
ALTER TABLE "Plant" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Plant" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TABLE "Log" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TYPE "Stage" RENAME TO "Stage_old";
ALTER TYPE "Stage_new" RENAME TO "Stage";
DROP TYPE "Stage_old";
ALTER TABLE "Plant" ALTER COLUMN "stage" SET DEFAULT 'VEGETATIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "actions",
DROP COLUMN "data",
DROP COLUMN "date",
DROP COLUMN "ec",
DROP COLUMN "materials",
DROP COLUMN "nutrientPpm",
DROP COLUMN "nutrients",
DROP COLUMN "pH",
DROP COLUMN "pestFound",
DROP COLUMN "runoff",
DROP COLUMN "symptoms",
ADD COLUMN     "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "actionTime" TEXT,
ADD COLUMN     "airflow" BOOLEAN,
ADD COLUMN     "boosterAmount" DOUBLE PRECISION,
ADD COLUMN     "branchCount" INTEGER,
ADD COLUMN     "curingDays" INTEGER,
ADD COLUMN     "customData" JSONB,
ADD COLUMN     "customNutrients" JSONB,
ADD COLUMN     "deficiencies" TEXT[],
ADD COLUMN     "diseaseSeverity" INTEGER,
ADD COLUMN     "diseaseTypes" "DiseaseType"[],
ADD COLUMN     "dryWeight" DOUBLE PRECISION,
ADD COLUMN     "dryWeightUnit" TEXT DEFAULT 'GRAMS',
ADD COLUMN     "dryingDays" INTEGER,
ADD COLUMN     "dryingHumidity" DOUBLE PRECISION,
ADD COLUMN     "dryingTemp" DOUBLE PRECISION,
ADD COLUMN     "estimatedYield" DOUBLE PRECISION,
ADD COLUMN     "estimatedYieldUnit" TEXT DEFAULT 'GRAMS',
ADD COLUMN     "finishAmount" DOUBLE PRECISION,
ADD COLUMN     "jacks321Used" "Jacks321Product"[],
ADD COLUMN     "leafColor" TEXT,
ADD COLUMN     "lightHeight" DOUBLE PRECISION,
ADD COLUMN     "lightHeightUnit" TEXT DEFAULT 'CENTIMETERS',
ADD COLUMN     "mediumMoisture" DOUBLE PRECISION,
ADD COLUMN     "mediumPh" DOUBLE PRECISION,
ADD COLUMN     "mediumTemp" DOUBLE PRECISION,
ADD COLUMN     "nutrientLine" "NutrientLine",
ADD COLUMN     "partAAmount" DOUBLE PRECISION,
ADD COLUMN     "partBAmount" DOUBLE PRECISION,
ADD COLUMN     "partCAmount" DOUBLE PRECISION,
ADD COLUMN     "pestSeverity" INTEGER,
ADD COLUMN     "pestTypes" "PestType"[],
ADD COLUMN     "ppfd" DOUBLE PRECISION,
ADD COLUMN     "runoffEc" DOUBLE PRECISION,
ADD COLUMN     "runoffPh" DOUBLE PRECISION,
ADD COLUMN     "sectionImages" JSONB,
ADD COLUMN     "sectionNotes" JSONB,
ADD COLUMN     "trainingMethods" "TrainingMethod"[],
ADD COLUMN     "treatmentDosage" DOUBLE PRECISION,
ADD COLUMN     "treatmentDosageUnit" TEXT,
ADD COLUMN     "treatmentMethods" "TreatmentMethod"[],
ADD COLUMN     "treatmentProducts" TEXT[],
ADD COLUMN     "trimAmount" DOUBLE PRECISION,
ADD COLUMN     "trimAmountUnit" TEXT DEFAULT 'GRAMS',
ADD COLUMN     "trimWeight" DOUBLE PRECISION,
ADD COLUMN     "trimWeightUnit" TEXT DEFAULT 'GRAMS',
ADD COLUMN     "waterEc" DOUBLE PRECISION,
ADD COLUMN     "waterPh" DOUBLE PRECISION,
ADD COLUMN     "waterSource" "WaterSource",
ADD COLUMN     "waterTemperature" DOUBLE PRECISION,
ADD COLUMN     "wetWeight" DOUBLE PRECISION,
ADD COLUMN     "wetWeightUnit" TEXT DEFAULT 'GRAMS';

-- AlterTable
ALTER TABLE "ZonePlant" DROP COLUMN "expectedHarvestDate",
DROP COLUMN "plantedDate",
DROP COLUMN "species",
DROP COLUMN "variety",
ADD COLUMN     "strain" TEXT,
ADD COLUMN     "type" TEXT;
