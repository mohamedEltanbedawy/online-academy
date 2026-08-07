-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "gatewayOrderId" TEXT,
ADD COLUMN "gatewayResponse" JSONB,
ADD COLUMN "gatewayTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");
