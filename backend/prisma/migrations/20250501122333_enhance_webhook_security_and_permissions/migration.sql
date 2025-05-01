-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "adminApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "allowedIpAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "dailyLimit" INTEGER,
ADD COLUMN     "dailyResetAt" TIMESTAMP(3),
ADD COLUMN     "dailyUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "verificationToken" TEXT;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
