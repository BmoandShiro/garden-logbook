/*
  Warnings:

  - You are about to drop the column `showLogs` on the `GardenLogVisibilityPreference` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `GardenLogVisibilityPreference` table. All the data in the column will be lost.
  - You are about to drop the column `lastChecked` on the `WeatherCheck` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `WeatherCheck` table. All the data in the column will be lost.
  - You are about to drop the column `lon` on the `WeatherCheck` table. All the data in the column will be lost.
  - You are about to drop the column `zip` on the `WeatherCheck` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `dimensions` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Zone` table. All the data in the column will be lost.
  - Added the required column `logType` to the `GardenLogVisibilityPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gardenId` to the `WeatherCheck` table without a default value. This is not possible if the table is not empty.
  - Made the column `data` on table `WeatherCheck` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `gardenId` to the `Zone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Zone` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_creatorId_fkey";

-- DropIndex
DROP INDEX "GardenLogVisibilityPreference_userId_gardenId_key";

-- DropIndex
DROP INDEX "WeatherCheck_zip_key";

-- AlterTable
ALTER TABLE "Garden" ADD COLUMN     "goveeApiKey" TEXT;

-- AlterTable
ALTER TABLE "GardenLogVisibilityPreference" DROP COLUMN "showLogs",
DROP COLUMN "userId",
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logType" "LogType" NOT NULL;

-- AlterTable
ALTER TABLE "WeatherCheck" DROP COLUMN "lastChecked",
DROP COLUMN "lat",
DROP COLUMN "lon",
DROP COLUMN "zip",
ADD COLUMN     "gardenId" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "data" SET NOT NULL;

-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "creatorId",
DROP COLUMN "dimensions",
DROP COLUMN "type",
ADD COLUMN     "gardenId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GoveeDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "zoneId" TEXT,
    "plantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "minTemp" DOUBLE PRECISION,
    "maxTemp" DOUBLE PRECISION,
    "minHumidity" DOUBLE PRECISION,
    "maxHumidity" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GoveeDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoveeReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "battery" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoveeReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoveeDevice_deviceId_key" ON "GoveeDevice"("deviceId");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenLogVisibilityPreference" ADD CONSTRAINT "GardenLogVisibilityPreference_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCheck" ADD CONSTRAINT "WeatherCheck_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoveeDevice" ADD CONSTRAINT "GoveeDevice_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoveeDevice" ADD CONSTRAINT "GoveeDevice_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoveeDevice" ADD CONSTRAINT "GoveeDevice_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoveeReading" ADD CONSTRAINT "GoveeReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GoveeDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
