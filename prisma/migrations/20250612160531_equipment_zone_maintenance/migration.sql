/*
  Warnings:

  - Added the required column `gardenId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gardenId` to the `MaintenanceTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "gardenId" TEXT NOT NULL,
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MaintenanceTask" ADD COLUMN     "equipmentId" TEXT,
ADD COLUMN     "gardenId" TEXT NOT NULL,
ADD COLUMN     "lastCompletedDate" TIMESTAMP(3),
ALTER COLUMN "roomId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
