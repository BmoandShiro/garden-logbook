-- CreateTable
CREATE TABLE "GardenInvite" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GardenInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GardenInvite_gardenId_email_key" ON "GardenInvite"("gardenId", "email");

-- AddForeignKey
ALTER TABLE "GardenInvite" ADD CONSTRAINT "GardenInvite_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
