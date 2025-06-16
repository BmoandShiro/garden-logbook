-- CreateTable
CREATE TABLE "GoveeDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastState" JSONB,
    "lastStateAt" TIMESTAMP(3),
    "linkedEntity" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoveeDevice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GoveeDevice" ADD CONSTRAINT "GoveeDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
