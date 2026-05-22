-- AlterTable
ALTER TABLE "users" ADD COLUMN "defaultAddressId" TEXT;

-- Backfill (primeiro endereço criado por usuário vira o padrão)
UPDATE "users" u
SET "defaultAddressId" = addr."id"
FROM (
    SELECT DISTINCT ON ("userId") "id", "userId"
    FROM "addresses"
    ORDER BY "userId", "createdAt" ASC
) AS addr
WHERE u."id" = addr."userId";

-- CreateIndex
CREATE UNIQUE INDEX "users_defaultAddressId_key" ON "users"("defaultAddressId");

-- AddForeignKey
ALTER TABLE "users"
ADD CONSTRAINT "users_defaultAddressId_fkey"
FOREIGN KEY ("defaultAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
