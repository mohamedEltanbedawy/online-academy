-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "externalKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_externalKey_key" ON "Person"("externalKey");
