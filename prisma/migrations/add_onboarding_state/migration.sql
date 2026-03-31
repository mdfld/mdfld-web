-- AlterTable
ALTER TABLE "user" ADD COLUMN "onboardingState" JSONB DEFAULT '{"buyer":[],"seller":[],"tours":[]}';
