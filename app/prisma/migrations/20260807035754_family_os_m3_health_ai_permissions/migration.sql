-- CreateEnum
CREATE TYPE "AiProviderType" AS ENUM ('GEMINI', 'OPENAI', 'OLLAMA');

-- CreateTable
CREATE TABLE "GrowthRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(6,2),
    "heightCm" DECIMAL(6,2),
    "headCm" DECIMAL(6,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(4,2),
    "quality" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SleepRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meal" TEXT,
    "foods" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "childId" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "AiProviderType" NOT NULL,
    "modelName" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "module" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthRecord_childId_date_idx" ON "GrowthRecord"("childId", "date");

-- CreateIndex
CREATE INDEX "GrowthRecord_tenantId_idx" ON "GrowthRecord"("tenantId");

-- CreateIndex
CREATE INDEX "Vaccination_childId_date_idx" ON "Vaccination"("childId", "date");

-- CreateIndex
CREATE INDEX "Vaccination_tenantId_idx" ON "Vaccination"("tenantId");

-- CreateIndex
CREATE INDEX "SleepRecord_childId_date_idx" ON "SleepRecord"("childId", "date");

-- CreateIndex
CREATE INDEX "SleepRecord_tenantId_idx" ON "SleepRecord"("tenantId");

-- CreateIndex
CREATE INDEX "NutritionRecord_childId_date_idx" ON "NutritionRecord"("childId", "date");

-- CreateIndex
CREATE INDEX "NutritionRecord_tenantId_idx" ON "NutritionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "Medicine_childId_idx" ON "Medicine"("childId");

-- CreateIndex
CREATE INDEX "Medicine_tenantId_idx" ON "Medicine"("tenantId");

-- CreateIndex
CREATE INDEX "HealthDocument_childId_idx" ON "HealthDocument"("childId");

-- CreateIndex
CREATE INDEX "HealthDocument_tenantId_idx" ON "HealthDocument"("tenantId");

-- CreateIndex
CREATE INDEX "AiProvider_tenantId_idx" ON "AiProvider"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRole_name_key" ON "AccessRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- AddForeignKey
ALTER TABLE "GrowthRecord" ADD CONSTRAINT "GrowthRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepRecord" ADD CONSTRAINT "SleepRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRecord" ADD CONSTRAINT "NutritionRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDocument" ADD CONSTRAINT "HealthDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDocument" ADD CONSTRAINT "HealthDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProvider" ADD CONSTRAINT "AiProvider_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
