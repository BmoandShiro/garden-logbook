-- CreateTable
CREATE TABLE "GardenLogVisibilityPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "showLogs" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GardenLogVisibilityPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GardenLogVisibilityPreference_userId_gardenId_key" ON "GardenLogVisibilityPreference"("userId", "gardenId");
