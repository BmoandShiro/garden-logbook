-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "zonePlantId" TEXT;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_zonePlantId_fkey" FOREIGN KEY ("zonePlantId") REFERENCES "ZonePlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
