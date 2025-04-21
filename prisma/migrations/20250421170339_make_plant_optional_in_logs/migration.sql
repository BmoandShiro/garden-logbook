-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "plantId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_plantId_fkey";

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
