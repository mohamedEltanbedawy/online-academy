-- CreateTable
CREATE TABLE "AcademyStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyProgram" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectsJson" JSONB,
    "objectives" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProgram" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "customPlan" TEXT,
    "focusAreas" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildProgram_childId_active_idx" ON "ChildProgram"("childId", "active");

-- AddForeignKey
ALTER TABLE "AcademyProgram" ADD CONSTRAINT "AcademyProgram_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "AcademyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProgram" ADD CONSTRAINT "ChildProgram_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProgram" ADD CONSTRAINT "ChildProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
