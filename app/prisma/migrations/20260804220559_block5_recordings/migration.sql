-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('STARTING', 'RECORDING', 'STOPPED', 'FAILED');

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "egressId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "RecordingStatus" NOT NULL DEFAULT 'STARTING',
    "filePath" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recording_egressId_key" ON "Recording"("egressId");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
