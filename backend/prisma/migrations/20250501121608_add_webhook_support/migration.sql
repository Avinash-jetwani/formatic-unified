-- CreateEnum
CREATE TYPE "WebhookAuthType" AS ENUM ('NONE', 'BASIC', 'BEARER', 'API_KEY');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('SUBMISSION_CREATED', 'SUBMISSION_UPDATED', 'FORM_PUBLISHED', 'FORM_UNPUBLISHED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "secretKey" TEXT,
    "authType" "WebhookAuthType" NOT NULL DEFAULT 'NONE',
    "authValue" TEXT,
    "eventTypes" "WebhookEventType"[] DEFAULT ARRAY['SUBMISSION_CREATED']::"WebhookEventType"[],
    "headers" JSONB,
    "includeFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "retryInterval" INTEGER NOT NULL DEFAULT 60,
    "filterConditions" JSONB,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "submissionId" TEXT,
    "eventType" "WebhookEventType" NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL,
    "requestTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTimestamp" TIMESTAMP(3),
    "requestBody" JSONB NOT NULL,
    "responseBody" JSONB,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttempt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
