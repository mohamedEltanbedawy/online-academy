-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('SCHOOL', 'ENGLISH', 'SOFT_SKILLS', 'COMPUTER', 'PROGRAMMING');

-- CreateEnum
CREATE TYPE "ScheduleEntryType" AS ENUM ('LESSON', 'HOMEWORK', 'EXERCISE');

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'SCHOOL',
    "description" TEXT,
    "bookTitle" TEXT,
    "teacher" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringLesson" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "duration" INTEGER,
    "teacher" TEXT,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonHomework" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "doneAt" TIMESTAMP(3),
    "notes" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonHomework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySchedule" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "subjectId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "label" TEXT NOT NULL,
    "type" "ScheduleEntryType" NOT NULL DEFAULT 'LESSON',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subject_childId_idx" ON "Subject"("childId");

-- CreateIndex
CREATE INDEX "Subject_tenantId_idx" ON "Subject"("tenantId");

-- CreateIndex
CREATE INDEX "TutoringLesson_childId_date_idx" ON "TutoringLesson"("childId", "date");

-- CreateIndex
CREATE INDEX "TutoringLesson_subjectId_idx" ON "TutoringLesson"("subjectId");

-- CreateIndex
CREATE INDEX "TutoringLesson_tenantId_idx" ON "TutoringLesson"("tenantId");

-- CreateIndex
CREATE INDEX "LessonHomework_lessonId_idx" ON "LessonHomework"("lessonId");

-- CreateIndex
CREATE INDEX "LessonHomework_tenantId_idx" ON "LessonHomework"("tenantId");

-- CreateIndex
CREATE INDEX "WeeklySchedule_childId_dayOfWeek_idx" ON "WeeklySchedule"("childId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WeeklySchedule_tenantId_idx" ON "WeeklySchedule"("tenantId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringLesson" ADD CONSTRAINT "TutoringLesson_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringLesson" ADD CONSTRAINT "TutoringLesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonHomework" ADD CONSTRAINT "LessonHomework_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TutoringLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
