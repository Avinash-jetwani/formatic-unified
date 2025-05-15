-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "adminLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deactivatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
