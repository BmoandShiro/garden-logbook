-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogType" ADD VALUE 'HST';
ALTER TYPE "LogType" ADD VALUE 'DRYING';
ALTER TYPE "LogType" ADD VALUE 'PEST_STRESS_DISEASE';
ALTER TYPE "LogType" ADD VALUE 'TRANSFER';
ALTER TYPE "LogType" ADD VALUE 'EQUIPMENT';

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "boosterAmount" DOUBLE PRECISION,
ADD COLUMN     "customNutrients" JSONB,
ADD COLUMN     "finishAmount" DOUBLE PRECISION,
ADD COLUMN     "jacks321Unit" TEXT,
ADD COLUMN     "jacks321Used" TEXT[],
ADD COLUMN     "nutrientLine" TEXT,
ADD COLUMN     "nutrientWaterPh" DOUBLE PRECISION,
ADD COLUMN     "nutrientWaterPpm" DOUBLE PRECISION,
ADD COLUMN     "partAAmount" DOUBLE PRECISION,
ADD COLUMN     "partBAmount" DOUBLE PRECISION,
ADD COLUMN     "partCAmount" DOUBLE PRECISION,
ADD COLUMN     "ppmScale" TEXT,
ADD COLUMN     "sourceWaterPh" DOUBLE PRECISION,
ADD COLUMN     "sourceWaterPpm" DOUBLE PRECISION,
ADD COLUMN     "waterSource" TEXT,
ADD COLUMN     "waterTemperature" DOUBLE PRECISION,
ADD COLUMN     "waterTemperatureUnit" TEXT,
ADD COLUMN     "waterUnit" TEXT;
