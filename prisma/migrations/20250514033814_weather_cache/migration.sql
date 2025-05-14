-- CreateTable
CREATE TABLE "WeatherCheck" (
    "id" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL,
    "data" JSONB,

    CONSTRAINT "WeatherCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCheck_zip_key" ON "WeatherCheck"("zip");
