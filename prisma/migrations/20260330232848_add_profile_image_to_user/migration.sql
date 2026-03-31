/*
  Warnings:

  - A unique constraint covering the columns `[profileImageId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_profileImageId_key" ON "users"("profileImageId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
