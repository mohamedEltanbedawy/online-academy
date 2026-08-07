ALTER TABLE "Payment" ADD COLUMN "nurseryInvoiceId" TEXT;
CREATE UNIQUE INDEX "Payment_nurseryInvoiceId_key" ON "Payment"("nurseryInvoiceId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_nurseryInvoiceId_fkey" FOREIGN KEY ("nurseryInvoiceId") REFERENCES "NurseryInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
