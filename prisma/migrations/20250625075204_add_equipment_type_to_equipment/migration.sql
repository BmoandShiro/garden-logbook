/*
  Warnings:

  - You are about to drop the column `gardenId` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `usePlantSpecificAlerts` on the `Zone` table. All the data in the column will be lost.
  - Added the required column `equipmentType` to the `Equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "equipmentType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "gardenId",
DROP COLUMN "usePlantSpecificAlerts";
