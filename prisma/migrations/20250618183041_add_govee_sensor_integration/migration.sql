-- CreateEnum
CREATE TYPE "WeatherAlertSource" AS ENUM ('WEATHER_API', 'SENSORS', 'BOTH');

-- AlterTable
ALTER TABLE "GoveeDevice" ADD COLUMN     "batteryLevel" INTEGER,
ADD COLUMN     "capabilities" JSONB,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "zoneId" TEXT;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "sensorAlertThresholds" JSONB,
ADD COLUMN     "weatherAlertSource" "WeatherAlertSource" NOT NULL DEFAULT 'WEATHER_API';

-- CreateTable
CREATE TABLE "GoveeReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "battery" INTEGER,
    "rawData" JSONB,
    "source" TEXT NOT NULL DEFAULT 'API',

    CONSTRAINT "GoveeReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoveeReading_deviceId_timestamp_idx" ON "GoveeReading"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "GoveeReading_timestamp_idx" ON "GoveeReading"("timestamp");

-- AddForeignKey
ALTER TABLE "GoveeDevice" ADD CONSTRAINT "GoveeDevice_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoveeReading" ADD CONSTRAINT "GoveeReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GoveeDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
