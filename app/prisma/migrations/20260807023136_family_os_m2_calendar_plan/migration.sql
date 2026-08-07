-- CreateEnum
CREATE TYPE "FamilyEventType" AS ENUM ('LESSON', 'ACTIVITY', 'APPOINTMENT', 'BIRTHDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlanItemType" AS ENUM ('TASK', 'LESSON', 'ACTIVITY', 'REMINDER');

-- CreateTable
CREATE TABLE "FamilyEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "familyId" TEXT,
    "title" TEXT NOT NULL,
    "type" "FamilyEventType" NOT NULL DEFAULT 'CUSTOM',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "familyId" TEXT,
    "day" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "time" TEXT,
    "type" "PlanItemType" NOT NULL DEFAULT 'TASK',
    "assignedToId" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyEvent_tenantId_startsAt_idx" ON "FamilyEvent"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "FamilyEvent_familyId_idx" ON "FamilyEvent"("familyId");

-- CreateIndex
CREATE INDEX "PlanItem_tenantId_day_idx" ON "PlanItem"("tenantId", "day");

-- CreateIndex
CREATE INDEX "PlanItem_familyId_idx" ON "PlanItem"("familyId");

-- CreateIndex
CREATE INDEX "PlanItem_assignedToId_idx" ON "PlanItem"("assignedToId");

-- AddForeignKey
ALTER TABLE "FamilyEvent" ADD CONSTRAINT "FamilyEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyEvent" ADD CONSTRAINT "FamilyEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
