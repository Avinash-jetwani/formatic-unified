-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "accessPassword" TEXT,
ADD COLUMN     "accessRestriction" TEXT DEFAULT 'none',
ADD COLUMN     "allowedEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "consentText" TEXT DEFAULT 'I consent to having this website store my submitted information.',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "maxSubmissions" INTEGER,
ADD COLUMN     "notificationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notificationType" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "requireConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PendingNotification" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "recipients" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PendingNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PendingNotification" ADD CONSTRAINT "PendingNotification_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingNotification" ADD CONSTRAINT "PendingNotification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
