CREATE TABLE "institutions" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL,
    "address" TEXT, "city" TEXT, "state" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL, "longitude" DOUBLE PRECISION NOT NULL,
    "osmType" TEXT NOT NULL, "osmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "institutions_osmType_osmId_key" ON "institutions"("osmType", "osmId");
CREATE INDEX "institutions_latitude_longitude_idx" ON "institutions"("latitude", "longitude");
CREATE INDEX "institutions_name_idx" ON "institutions"("name");
CREATE TABLE "institution_lookup_cache" (
    "key" TEXT NOT NULL, "payload" JSONB NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "institution_lookup_cache_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "institution_lookup_cache_expiresAt_idx" ON "institution_lookup_cache"("expiresAt");
ALTER TABLE "users" ADD COLUMN "institutionId" TEXT;
CREATE INDEX "users_institutionId_idx" ON "users"("institutionId");
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
