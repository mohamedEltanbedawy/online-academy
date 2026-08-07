-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAssessment" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildAssessment_childId_skillId_assessedAt_idx" ON "ChildAssessment"("childId", "skillId", "assessedAt");

-- AddForeignKey
ALTER TABLE "ChildAssessment" ADD CONSTRAINT "ChildAssessment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAssessment" ADD CONSTRAINT "ChildAssessment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAssessment" ADD CONSTRAINT "ChildAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
