-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PARENT';
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "stage" TEXT,
    "schoolGrade" TEXT,
    "notes" TEXT,
    "medicalNotes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGuardian" (
    "childId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'ولي أمر',
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChildGuardian_pkey" PRIMARY KEY ("childId","guardianId")
);

-- CreateIndex
CREATE INDEX "ChildGuardian_guardianId_idx" ON "ChildGuardian"("guardianId");

-- AddForeignKey
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
