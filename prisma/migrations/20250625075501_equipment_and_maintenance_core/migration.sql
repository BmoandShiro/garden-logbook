-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "gardenId" TEXT,
ADD COLUMN     "usePlantSpecificAlerts" BOOLEAN NOT NULL DEFAULT false;
