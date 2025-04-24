-- CreateTable
CREATE TABLE "Seed" (
    "id" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "strain" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "breeder" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dateAcquired" TIMESTAMP(3) NOT NULL,
    "dateHarvested" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Seed_userId_idx" ON "Seed"("userId");

-- AddForeignKey
ALTER TABLE "Seed" ADD CONSTRAINT "Seed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
