-- CreateEnum
CREATE TYPE "NurserySubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "NurseryInvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "NurserySubscription" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "status" "NurserySubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurserySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "NurseryInvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NurseryInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NurseryInvoice_invoiceNumber_key" ON "NurseryInvoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "NurserySubscription" ADD CONSTRAINT "NurserySubscription_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryInvoice" ADD CONSTRAINT "NurseryInvoice_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryInvoice" ADD CONSTRAINT "NurseryInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "NurserySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
