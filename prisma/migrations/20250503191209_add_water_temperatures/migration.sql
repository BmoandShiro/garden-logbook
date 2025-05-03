-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "nutrientWaterTemperature" DOUBLE PRECISION,
ADD COLUMN     "nutrientWaterTemperatureUnit" TEXT,
ADD COLUMN     "sourceWaterTemperature" DOUBLE PRECISION,
ADD COLUMN     "sourceWaterTemperatureUnit" TEXT;
