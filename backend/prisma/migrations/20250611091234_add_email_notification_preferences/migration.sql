-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "formAnalyticsReports" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "webhookNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "emailNotifications" SET DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "securityNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "webhookNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklyReports" BOOLEAN NOT NULL DEFAULT true;
