import { randomInt } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymobPayment, paymobConfigured } from "@/lib/paymob";

export async function POST(request: Request) {
  const parent = await getCurrentUser();
  if (!parent || parent.role !== "PARENT") return Response.json({ message: "غير مسموح" }, { status: 403 });
  if (!paymobConfigured()) return Response.json({ message: "بوابة Paymob غير مفعلة" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
  const invoice = await prisma.nurseryInvoice.findFirst({ where: { id: invoiceId, status: { not: "PAID" }, child: { guardians: { some: { guardianId: parent.id } } } }, include: { child: true } });
  if (!invoice) return Response.json({ message: "الفاتورة غير موجودة أو مدفوعة" }, { status: 404 });
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const payment = await prisma.payment.create({ data: { receiptNumber: `N-ONL-${Date.now()}-${randomInt(100, 999)}`, cashierId: admin.id, amount: invoice.amount, method: "GATEWAY", status: "PENDING", description: `سداد فاتورة ${invoice.invoiceNumber}`, nurseryInvoiceId: invoice.id } });
  try {
    const gateway = await createPaymobPayment({ amountCents: Math.round(invoice.amount.toNumber() * 100), orderReference: payment.id, name: parent.name, email: parent.email, phone: parent.phone });
    await prisma.payment.update({ where: { id: payment.id }, data: { gatewayOrderId: gateway.orderId, gatewayResponse: { orderId: gateway.orderId } } });
    return Response.json({ paymentId: payment.id, iframeUrl: gateway.iframeUrl });
  } catch (error) {
    console.error("Nursery Paymob start failed", error);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return Response.json({ message: "تعذر تجهيز الدفع الإلكتروني" }, { status: 502 });
  }
}
