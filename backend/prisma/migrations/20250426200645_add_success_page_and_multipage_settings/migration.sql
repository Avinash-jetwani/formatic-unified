-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "multiPageEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "successRedirectUrl" TEXT;
