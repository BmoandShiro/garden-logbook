/*
  Warnings:

  - You are about to drop the column `isOnline` on the `GoveeDevice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,deviceId]` on the table `GoveeDevice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GoveeDevice" DROP COLUMN "isOnline",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "GoveeDevice_userId_deviceId_key" ON "GoveeDevice"("userId", "deviceId");
