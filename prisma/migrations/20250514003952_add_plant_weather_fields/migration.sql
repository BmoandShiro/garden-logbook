-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "growingSeasonEnd" TEXT,
ADD COLUMN     "growingSeasonStart" TEXT,
ADD COLUMN     "onlyTriggerAlertsDuringSeason" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sensitivities" JSONB;
