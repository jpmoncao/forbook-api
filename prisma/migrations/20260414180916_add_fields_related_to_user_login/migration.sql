-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReceiveTwoFactorAuthEmail" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "verify_email_attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "code" VARCHAR(6) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verify_email_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verify_email_attempt_userId_key" ON "verify_email_attempt"("userId");

-- AddForeignKey
ALTER TABLE "verify_email_attempt" ADD CONSTRAINT "verify_email_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
