-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "equipmentId" TEXT;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
